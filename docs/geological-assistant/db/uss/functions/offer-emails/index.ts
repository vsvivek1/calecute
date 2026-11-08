/**
 * Offer emails: the admin writes an offer (subject, message, optional coupon),
 * picks who gets it, sends a test to themselves, then sends to everyone.
 *
 * Tables: schema `offers` (0011_offer_emails.sql), reached with SUPABASE_DB_URL.
 * Mail: Resend (RESEND_API_KEY, EMAIL_FROM). Every email carries an unsubscribe
 * link (offers.contacts.token, page at calecutech.com/offers/unsubscribe) and a
 * one-click List-Unsubscribe header (offer-unsubscribe function).
 * A campaign never emails the same address twice (offers.sends primary key),
 * and an unsubscribed address is never emailed again, from any course.
 *
 * Audiences are listed per course in COURSES below. To add a course, add an
 * entry there with SQL that returns its learners' emails.
 *
 * Deploy (USS project):
 *   supabase functions deploy offer-emails
 *   Secrets (owner adds them, never pasted in chat):
 *     RESEND_API_KEY, EMAIL_FROM (e.g. "Geological Assistant Prep <offers@calecutech.com>"),
 *     QUIZKERALA_DATABASE_URL (read-only connection string of the QuizKerala database;
 *       without it the QuizKerala audience shows as "not connected").
 *
 * Body: { action: 'overview' | 'test' | 'create' | 'send', ... } with the admin's JWT.
 */
import postgres from 'npm:postgres@3.4.5';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM');
const EMAIL_REPLY_TO = Deno.env.get('EMAIL_REPLY_TO') || 'info@calecutech.com';
const QK_URL = Deno.env.get('QUIZKERALA_DATABASE_URL');

const db = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 2 });
const qk = QK_URL ? postgres(QK_URL, { ssl: 'require', prepare: false, max: 1 }) : null;

const UNSUB_PAGE = 'https://calecutech.com/offers/unsubscribe';
const UNSUB_ONE_CLICK = `${SUPABASE_URL}/functions/v1/offer-unsubscribe`;
const SENDER = 'Calecute Technologies (OPC) Private Limited, Poolakadavu, Kozhikode, Kerala 673012';
const PER_CALL = 300; // emails per 'send' call; the admin screen calls again until done
const BATCH = 100; // Resend batch limit

type Recipient = { email: string; audience: string };
type Audience = {
  label: string;
  why: string; // shown in the email footer: why this person gets it
  load: () => Promise<string[] | null>; // null = source not connected
};
type Course = {
  name: string;
  link: string; // where the button goes (coupon added as ?coupon=)
  paidEmails: () => Promise<Set<string>>; // people with access now, skipped when skip_paid
  audiences: Record<string, Audience>;
};

const lower = (rows: { email: string | null }[]) =>
  rows.map((r) => (r.email ?? '').trim().toLowerCase()).filter((e) => e.includes('@'));

const COURSES: Record<string, Course> = {
  'geological-assistant': {
    name: 'Geological Assistant Prep',
    link: 'https://calecutech.com/geological-assistant/study',
    paidEmails: async () => new Set(lower(await db`
      select u.email from geological_assistant.subscriptions s join auth.users u on u.id = s.user_id
      where s.course_id = 'geological-assistant' and s.status = 'active'
        and (s.current_period_end is null or s.current_period_end > now())`)),
    audiences: {
      ga_learners: {
        label: 'Signed up on the Geological Assistant course',
        why: 'you signed in to Geological Assistant Prep on calecutech.com',
        load: async () => lower(await db`
          select coalesce(p.email, u.email) as email from geological_assistant.user_profile p
            left join auth.users u on u.id = p.user_id
          union
          select u.email from geological_assistant.subscriptions s join auth.users u on u.id = s.user_id
            where s.course_id = 'geological-assistant'`),
      },
      ga_quiz_signups: {
        label: 'QuizKerala "free PSC questions" sign-ups who asked for Geological Assistant',
        why: 'you signed up for free PSC questions on QuizKerala and asked about Geological Assistant',
        // Ticked "Geological Assistant", or typed it under "Other". Unsubscribed people are left out.
        load: async () => qk ? lower(await qk`
          select email from psc_signups
          where unsubscribed_at is null
            and (exams @> '["Geological Assistant"]'::jsonb or coalesce(other_exam, '') ~* 'geolog')`) : null,
      },
    },
  },
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

/** Everyone a campaign would reach now: deduped, unsubscribed and (optionally) paid people left out. */
async function recipients(course: Course, keys: string[], skipPaid: boolean) {
  const counts: Record<string, number | null> = {};
  const seen = new Set<string>();
  const out: Recipient[] = [];
  const unsub = new Set(lower(await db`select email from offers.contacts where unsubscribed_at is not null`));
  const paid = skipPaid ? await course.paidEmails() : new Set<string>();
  for (const key of keys) {
    const a = course.audiences[key];
    if (!a) continue;
    const list = await a.load();
    if (list === null) { counts[key] = null; continue; }
    let n = 0;
    for (const email of list) {
      if (seen.has(email) || unsub.has(email) || paid.has(email)) continue;
      seen.add(email);
      out.push({ email, audience: key });
      n++;
    }
    counts[key] = n;
  }
  return { list: out, counts };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

function linkFor(course: Course, coupon: string | null, campaignId: string) {
  const u = new URL(course.link);
  if (coupon) u.searchParams.set('coupon', coupon);
  u.searchParams.set('utm_source', 'email');
  u.searchParams.set('utm_campaign', 'offer-' + campaignId.slice(0, 8));
  return u.toString();
}

/** The email itself. The message is plain text from the admin: escaped, blank lines make paragraphs. */
function render(course: Course, c: { subject: string; body: string; coupon: string | null; link: string },
  why: string, token: string | null) {
  const unsubUrl = token ? `${UNSUB_PAGE}?t=${token}` : UNSUB_PAGE;
  const paras = c.body.trim().split(/\n\s*\n/).map((p) =>
    `<p style="margin:0 0 14px">${esc(p).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')}</p>`).join('');
  const couponBox = c.coupon ? `<p style="margin:18px 0;padding:14px;border:2px dashed #b4531f;border-radius:8px;text-align:center;font-size:18px">
      Use code <strong style="font-size:22px;letter-spacing:1px">${esc(c.coupon)}</strong></p>` : '';
  const html = `<!doctype html><html><body style="margin:0;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;color:#1f2a33">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#fff;border-radius:10px;padding:24px;font-size:15px;line-height:1.55">
<p style="margin:0 0 16px;font-weight:bold;color:#b4531f">${esc(course.name)}</p>
${paras}${couponBox}
<p style="margin:20px 0 4px;text-align:center"><a href="${esc(c.link)}" style="display:inline-block;background:#b4531f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:bold">Open the offer</a></p>
</div>
<p style="font-size:12px;color:#666;line-height:1.5;margin:14px 4px">You get this email because ${esc(why)}.
<a href="${esc(unsubUrl)}" style="color:#666">Unsubscribe</a> and we will not send you offers again.<br>${esc(SENDER)}</p>
</div></body></html>`;
  const text = `${c.body.trim()}\n\n${c.coupon ? `Use code ${c.coupon}\n` : ''}${c.link}\n\n--\nYou get this email because ${why}.\nUnsubscribe: ${unsubUrl}\n${SENDER}`;
  const headers: Record<string, string> = token
    ? { 'List-Unsubscribe': `<${UNSUB_ONE_CLICK}?t=${token}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
    : {};
  return { html, text, headers };
}

async function resendBatch(messages: Record<string, unknown>[]) {
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Email service said ${res.status}: ${body.slice(0, 300)}`);
  return (JSON.parse(body).data ?? []) as { id: string }[];
}

/** The unsubscribe token for each address (made on first use). */
async function tokens(emails: string[]) {
  if (!emails.length) return new Map<string, string>();
  await db`insert into offers.contacts ${db(emails.map((email) => ({ email })))} on conflict (email) do nothing`;
  const rows = await db`select email, token from offers.contacts where email = any(${emails})`;
  return new Map(rows.map((r) => [r.email as string, r.token as string]));
}

async function checkCoupon(courseId: string, code: string | null) {
  if (!code) return null;
  const clean = code.trim().toUpperCase();
  const [k] = await db`select code, active, expires_at from geological_assistant.coupons
    where code = ${clean} and course_id = ${courseId}`;
  if (!k || !k.active) throw new Error(`Coupon ${clean} does not exist or is turned off`);
  if (k.expires_at && new Date(k.expires_at) <= new Date()) throw new Error(`Coupon ${clean} has expired`);
  return clean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  const me = (user?.email ?? '').toLowerCase();
  if (!me) return json({ error: 'Not signed in' }, 401);
  const [isAdmin] = await db`select 1 from offers.admins where email = ${me}`;
  if (!isAdmin) return json({ error: 'Admins only' }, 403);

  let input: Record<string, unknown>;
  try { input = await req.json(); } catch { return json({ error: 'Bad body' }, 400); }
  const courseId = String(input.course ?? 'geological-assistant');
  const course = COURSES[courseId];
  if (!course) return json({ error: 'Unknown course' }, 400);
  const mailReady = !!(RESEND_API_KEY && EMAIL_FROM);

  try {
    if (input.action === 'overview') {
      const keys = Object.keys(course.audiences);
      const { counts } = await recipients(course, keys, input.skipPaid !== false);
      const campaigns = await db`
        select c.id, c.subject, c.coupon_code, c.audiences, c.created_at, c.finished_at,
          count(s.*) filter (where s.status = 'sent')::int as sent
        from offers.campaigns c left join offers.sends s on s.campaign_id = c.id
        where c.course = ${courseId} group by c.id order by c.created_at desc limit 20`;
      const [{ n: unsubscribed }] = await db`select count(*)::int as n from offers.contacts where unsubscribed_at is not null`;
      return json({
        mailReady, quizKeralaReady: !!qk, unsubscribed,
        audiences: keys.map((k) => ({ key: k, label: course.audiences[k].label, count: counts[k] })),
        campaigns,
      });
    }

    const subject = String(input.subject ?? '').trim();
    const body = String(input.body ?? '').trim();

    if (input.action === 'test') {
      if (!mailReady) return json({ error: 'Email is not set up yet (RESEND_API_KEY, EMAIL_FROM)' }, 503);
      if (subject.length < 3 || body.length < 10) return json({ error: 'Write a subject and a message first' }, 400);
      const coupon = await checkCoupon(courseId, (input.couponCode as string) || null);
      const link = linkFor(course, coupon, 'test0000');
      const t = await tokens([me]);
      const m = render(course, { subject, body, coupon, link }, 'you are testing an offer as admin', t.get(me) ?? null);
      await resendBatch([{ from: EMAIL_FROM, to: [me], reply_to: EMAIL_REPLY_TO, subject: '[TEST] ' + subject, ...m }]);
      return json({ ok: true, to: me });
    }

    if (input.action === 'create') {
      if (subject.length < 3 || subject.length > 150) return json({ error: 'Subject must be 3 to 150 characters' }, 400);
      if (body.length < 10 || body.length > 5000) return json({ error: 'Message must be 10 to 5,000 characters' }, 400);
      const keys = (Array.isArray(input.audiences) ? input.audiences : []).map(String).filter((k) => course.audiences[k]);
      if (!keys.length) return json({ error: 'Pick at least one audience' }, 400);
      const coupon = await checkCoupon(courseId, (input.couponCode as string) || null);
      const [c] = await db`insert into offers.campaigns (course, subject, body, coupon_code, link_url, audiences, skip_paid, created_by)
        values (${courseId}, ${subject}, ${body}, ${coupon}, ${course.link}, ${keys}, ${input.skipPaid !== false}, ${me})
        returning id`;
      return json({ id: c.id });
    }

    if (input.action === 'send') {
      if (!mailReady) return json({ error: 'Email is not set up yet (RESEND_API_KEY, EMAIL_FROM)' }, 503);
      const [c] = await db`select * from offers.campaigns where id = ${String(input.campaignId ?? '')} and course = ${courseId}`;
      if (!c) return json({ error: 'No such offer' }, 404);
      const { list } = await recipients(course, c.audiences, c.skip_paid);
      const done = new Set(lower(await db`select email from offers.sends where campaign_id = ${c.id}`));
      const todo = list.filter((r) => !done.has(r.email)).slice(0, PER_CALL);
      const link = linkFor(course, c.coupon_code, c.id);
      const tok = await tokens(todo.map((r) => r.email));
      let sent = 0;
      for (let i = 0; i < todo.length; i += BATCH) {
        // Claim the rows first, so a second click cannot send the same email twice.
        const claimed = await db`insert into offers.sends ${db(todo.slice(i, i + BATCH).map((r) => ({
          campaign_id: c.id, email: r.email, audience: r.audience, status: 'failed', error: 'sending' })))}
          on conflict do nothing returning email, audience`;
        if (!claimed.length) continue;
        const messages = claimed.map((r) => {
          const why = course.audiences[r.audience]?.why ?? 'you signed up with Calecute';
          const m = render(course, { subject: c.subject, body: c.body, coupon: c.coupon_code, link }, why, tok.get(r.email) ?? null);
          return { from: EMAIL_FROM, to: [r.email], reply_to: EMAIL_REPLY_TO, subject: c.subject, ...m };
        });
        try {
          const ids = await resendBatch(messages);
          for (let j = 0; j < claimed.length; j++) {
            await db`update offers.sends set status = 'sent', error = null, provider_id = ${ids[j]?.id ?? null}, sent_at = now()
              where campaign_id = ${c.id} and email = ${claimed[j].email}`;
          }
          sent += claimed.length;
        } catch (e) {
          // Not sent: free the rows so the next click tries them again.
          await db`delete from offers.sends where campaign_id = ${c.id} and email = any(${claimed.map((r) => r.email)})`;
          return json({ error: (e as Error).message, sent }, 502);
        }
        await new Promise((r) => setTimeout(r, 600)); // stay under Resend's 2 requests a second
      }
      const remaining = list.filter((r) => !done.has(r.email)).length - sent;
      if (remaining <= 0) await db`update offers.campaigns set finished_at = coalesce(finished_at, now()) where id = ${c.id}`;
      return json({ sent, remaining: Math.max(0, remaining) });
    }

    return json({ error: 'Unknown action' }, 400);
  } catch (e) {
    console.error('offer-emails failed', e);
    return json({ error: (e as Error).message }, 400);
  }
});
