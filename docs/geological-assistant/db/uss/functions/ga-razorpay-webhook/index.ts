/**
 * Razorpay webhook for Geological Assistant: the only thing that grants access.
 *
 * Writes geological_assistant.subscriptions in the USS project. One-time
 * payment, lifetime access: current_period_end stays null. The browser's
 * success callback grants nothing; only a payload signed with the webhook
 * secret does.
 *
 * Razorpay sends every account event to every webhook, so payments for other
 * courses arrive here too. Those are acknowledged (200) and ignored.
 *
 * Deploy (USS project; Razorpay sends no Supabase JWT, the signature is the auth):
 *   supabase functions deploy ga-razorpay-webhook --no-verify-jwt
 *   supabase secrets set RAZORPAY_WEBHOOK_SECRET=...
 * It also asks the shared Calecute invoicing API (apps/api, one number
 * series for the whole GSTIN) for the GST tax invoice on each capture and a
 * credit note on each refund, and keeps the number and PDF link on the order.
 * Both calls are idempotent, so a repeated delivery gets the same document.
 *   supabase secrets set CALECUTE_API_URL=https://... CALECUTE_API_KEY=...
 * Without those two secrets invoicing is skipped (logged), access still works.
 *
 * Razorpay dashboard > Webhooks: URL .../functions/v1/ga-razorpay-webhook,
 * events payment.captured and refund.processed.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SCHEMA = 'geological_assistant';
const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const INVOICE_API_URL = Deno.env.get('CALECUTE_API_URL')?.replace(/\/+$/, '');
const INVOICE_API_KEY = Deno.env.get('CALECUTE_API_KEY');

type Admin = ReturnType<typeof createClient>;

const isoFromUnix = (seconds?: number) =>
  new Date((seconds ?? Date.now() / 1000) * 1000).toISOString();

/** POST to the invoicing API. Throws on anything but 200/201. */
async function invoiceApi(path: string, body: unknown) {
  const res = await fetch(`${INVOICE_API_URL}/api/v1${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': INVOICE_API_KEY! },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${await res.text()}`);
  return await res.json() as { number: string; pdfUrl: string };
}

/**
 * Invoice for a capture, credit note for a refund, through the shared API.
 * The number and link are kept on the order so the study page can list them.
 */
async function issueDocument(
  admin: Admin,
  status: 'active' | 'refunded',
  payment: Record<string, any>,
  refund: Record<string, any> | undefined,
  userId: string,
) {
  if (!INVOICE_API_URL || !INVOICE_API_KEY) {
    console.warn('invoicing skipped: CALECUTE_API_URL / CALECUTE_API_KEY not set');
    return;
  }
  const { data: order } = payment.order_id
    ? await admin.from('payment_orders')
      .select('billing_name, billing_state_code, billing_gstin')
      .eq('provider_ref', payment.order_id).maybeSingle()
    : { data: null };

  if (status === 'active') {
    let name = order?.billing_name || null;
    if (!name) {
      const { data } = await admin.auth.admin.getUserById(userId);
      const meta = data?.user?.user_metadata ?? {};
      name = meta.full_name || meta.name || null;
    }
    const doc = await invoiceApi('/invoices', {
      paymentRef: payment.id,
      customerRef: userId,
      amountPaise: payment.amount,
      paidAt: isoFromUnix(payment.created_at),
      description: 'Kerala PSC Geological Assistant online course, lifetime access',
      buyer: {
        name,
        email: payment.email || null,
        gstin: order?.billing_gstin || null,
        stateCode: order?.billing_state_code || null,
      },
    });
    if (payment.order_id) {
      await admin.from('payment_orders')
        .update({ invoice_no: doc.number, invoice_pdf_url: doc.pdfUrl })
        .eq('provider_ref', payment.order_id);
    }
    return;
  }

  if (!refund?.id) return;
  try {
    const doc = await invoiceApi('/credit-notes', {
      paymentRef: payment.id,
      refundRef: refund.id,
      amountPaise: refund.amount,
      refundedAt: isoFromUnix(refund.created_at),
    });
    if (payment.order_id) {
      await admin.from('payment_orders')
        .update({ credit_note_no: doc.number, credit_note_pdf_url: doc.pdfUrl })
        .eq('provider_ref', payment.order_id);
    }
  } catch (e) {
    // Paid before invoicing started: there is no invoice to credit.
    if (String(e).includes(' 404:')) return;
    throw e;
  }
}

/** HMAC-SHA256 of the raw body, compared in constant time. */
async function isSignatureValid(secret: string, raw: string, signature: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  if (!WEBHOOK_SECRET) return new Response('Not configured', { status: 503 });

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) return new Response('Unsigned', { status: 401 });

  // Byte-for-byte body; re-serialised JSON would not match the signature.
  const raw = await req.text();
  if (!(await isSignatureValid(WEBHOOK_SECRET, raw, signature))) {
    console.warn('rejected a webhook with a bad signature');
    return new Response('Bad signature', { status: 401 });
  }

  const event = JSON.parse(raw);
  const status =
    event.event === 'payment.captured' ? 'active'
    : event.event === 'refund.processed' ? 'refunded'
    : null;
  if (!status) return new Response('ignored', { status: 200 });

  // Refund events carry the original payment entity too, with its notes.
  const payment = event.payload?.payment?.entity;
  const notes = payment?.notes ?? {};
  const userId = notes.user_id;
  const courseId = notes.course_id;
  if (!payment?.id || !userId || !courseId) {
    return new Response('ignored', { status: 200 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

  // Not one of ours (another app on the same Razorpay account).
  const { data: course } = await admin.from('courses').select('id').eq('id', courseId).maybeSingle();
  if (!course) return new Response('ignored', { status: 200 });

  // Upsert on provider_ref: webhooks are delivered more than once, and a
  // refund must update the same row the capture created.
  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      course_id: courseId,
      provider: 'razorpay',
      provider_ref: payment.id,
      amount_minor: payment.amount ?? null,
      status,
      current_period_end: null,
    },
    { onConflict: 'provider_ref' },
  );
  if (error) {
    console.error('could not record the subscription', error);
    // 500 makes Razorpay retry: the payment happened and the user is waiting.
    return new Response('retry', { status: 500 });
  }

  if (payment.order_id) {
    const newStatus = status === 'active' ? 'paid' : 'refunded';
    // Only the first delivery that flips the order to paid counts a coupon use.
    const { data: changed } = await admin
      .from('payment_orders')
      .update({ status: newStatus })
      .eq('provider_ref', payment.order_id)
      .neq('status', newStatus)
      .select('coupon_code');
    const code = newStatus === 'paid' ? changed?.[0]?.coupon_code : null;
    if (code) {
      const { error: redeemError } = await admin.rpc('redeem_coupon', { p_code: code });
      if (redeemError) console.error('could not count the coupon use', redeemError);
    }
  }

  // Access is already granted above; an invoice failure only makes Razorpay
  // retry, and the retry finds the subscription in place.
  try {
    await issueDocument(admin, status, payment, event.payload?.refund?.entity, userId);
  } catch (e) {
    console.error('could not issue the invoice', e);
    return new Response('retry', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
