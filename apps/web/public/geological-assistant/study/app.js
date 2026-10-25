// Geological Assistant Prep: the web course.
//
// A static page talking straight to Supabase (USS project, schema
// geological_assistant). There is no server of our own here, and none is
// needed: row-level security decides what a signed-in user can read, and
// cards and questions are readable only with an active subscription. The
// price and the unlock are decided by the ga-razorpay-* edge functions, never
// by this page.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.58.0/+esm';

const SUPABASE_URL = 'https://vspbbwpehvenmxddgbhm.supabase.co';
// Publishable key: safe in a browser by design. RLS does the protecting.
const SUPABASE_KEY = 'sb_publishable_8yQLCPZV55NwBKI5ybeRAg__UggFFK_';
const COURSE = 'geological-assistant';
const PREFIX = COURSE + '-';
const NEW_PER_DAY = 25;
const MOCK = { count: 100, minutes: 75, negative: 1 / 4 };
const HOME = location.origin + '/geological-assistant/study';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'geological_assistant' },
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
});

const app = document.getElementById('app');
const state = { user: null, paid: false, modules: [], course: null };

// ---------- tiny DOM helper (text only: data is never parsed as HTML) ----------
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) el.append(k instanceof Node ? k : String(k));
  return el;
}
function show(...nodes) { app.replaceChildren(...nodes); window.scrollTo(0, 0); }
function rupees(minor) { return '₹' + (minor / 100).toLocaleString('en-IN'); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function unitOfQuestion(id) { const m = id.slice(PREFIX.length).match(/^u(\d)/); return m ? +m[1] : null; }
function answerOf(q) { return (q.verified_answer || q.official_answer || '').trim().toLowerCase(); }
function errorBox(msg) { return h('p', { class: 'err' }, msg); }

// PostgREST returns at most 1000 rows per request; page through.
async function all(query) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query().range(from, from + 999);
    if (error) throw error;
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

// ---------- boot ----------
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  state.user = session?.user ?? null;
  document.getElementById('signout').hidden = !state.user;
  const [{ data: course }, { data: modules }] = await Promise.all([
    sb.from('courses').select('id,name,price_minor,price_currency').eq('id', COURSE).maybeSingle(),
    sb.from('modules').select('id,module_no,name').eq('course_id', COURSE).order('module_no'),
  ]);
  state.course = course;
  state.modules = modules ?? [];
  if (state.user) {
    const { data } = await sb.rpc('has_active_subscription', { p_course_id: COURSE });
    state.paid = data === true;
    // First visit: a profile row, so the account exists for this course.
    sb.from('user_profile').insert({ user_id: state.user.id, email: state.user.email, course_id: COURSE }).then(() => {});
  }
  route();
}

document.getElementById('signout').addEventListener('click', async (e) => {
  e.preventDefault();
  await sb.auth.signOut();
  location.href = HOME;
});
window.addEventListener('hashchange', route);

function route() {
  const [, page] = (location.hash || '#/').split('/');
  if (!state.user) return signIn();
  if (!state.paid) return buy();
  // There is no unit or mode picker: old #/study/<unit> and #/quiz/<unit> links land on today's plan.
  if (page === 'today') return today();
  if (page === 'mock') return mock();
  if (page === 'results') return results();
  return home();
}

// Invite to the free general PSC questions site, shown under sign-in and pay.
function freePscBanner() {
  return h('a', { class: 'freepsc', href: 'https://quiz.calecutech.com/free-psc-questions?utm_source=geological-assistant&utm_medium=banner', target: '_blank', rel: 'noopener' },
    h('span', { class: 'fp-badge' }, 'FREE'),
    h('span', { class: 'fp-text' },
      h('b', {}, 'Writing other Kerala PSC exams too?'),
      h('span', {}, 'Join our free PSC questions channel for LDC, LGS, Degree Level and every general PSC exam. No payment, no sign-up fee.')),
    h('span', { class: 'fp-go' }, 'Join free PSC questions →'));
}

// ---------- sign in ----------
function signIn() {
  const msg = h('p', { class: 'err', hidden: true });
  show(
    h('h1', {}, 'Sign in to your course'),
    h('p', { class: 'lead' }, 'Use the same Google account on the web and in the app. Your progress follows you.'),
    h('div', { class: 'panel' },
      h('button', { class: 'btn', onclick: async () => {
        const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: HOME } });
        if (error) { msg.hidden = false; msg.textContent = 'Could not open Google sign-in: ' + error.message; }
      } }, 'Continue with Google'),
      msg,
      h('p', { class: 'small' }, 'We use your name and email only to run your account. See the ',
        h('a', { href: 'privacy/' }, 'Privacy Policy'), '.')),
    freePscBanner(),
  );
}

// ---------- buy ----------
function loadRazorpay() {
  return new Promise((ok, bad) => {
    if (window.Razorpay) return ok();
    const s = h('script', { src: 'https://checkout.razorpay.com/v1/checkout.js' });
    s.onload = ok; s.onerror = () => bad(new Error('Could not load the payment window.'));
    document.body.append(s);
  });
}

function buy() {
  const price = state.course?.price_minor ?? 300000;
  const msg = h('div');
  const button = h('button', { class: 'btn', onclick: pay }, 'Pay ' + rupees(price) + ' by UPI, card or netbanking');

  async function pay() {
    button.disabled = true;
    msg.replaceChildren();
    try {
      await loadRazorpay();
      const { data, error } = await sb.functions.invoke('ga-razorpay-create-order', { body: { courseId: COURSE } });
      if (error || !data?.orderId) {
        let detail = data?.error;
        try { detail = detail || (await error?.context?.json())?.error; } catch { /* not JSON */ }
        throw new Error(detail || 'Could not start the payment. Please try again.');
      }
      new window.Razorpay({
        key: data.keyId, order_id: data.orderId, amount: data.amount, currency: data.currency,
        name: 'Geological Assistant Prep', description: 'Lifetime access',
        prefill: { email: state.user.email, name: state.user.user_metadata?.full_name || '' },
        theme: { color: '#b4531f' },
        handler: () => waitForUnlock(msg),
        modal: { ondismiss: () => { button.disabled = false; } },
      }).open();
    } catch (e) {
      msg.replaceChildren(errorBox(e.message));
      button.disabled = false;
    }
  }

  show(
    h('h1', {}, 'Unlock the full course'),
    h('p', { class: 'small' }, 'Signed in as ' + (state.user.email || '')),
    h('div', { class: 'panel' },
      h('p', { class: 'big' }, rupees(price), h('span', { class: 'small' }, '  one-time, lifetime access')),
      h('ul', {},
        h('li', {}, '1,854 fact cards with the reason behind each fact'),
        h('li', {}, '1,212 practice questions, unit quizzes and timed mock tests'),
        h('li', {}, 'Spaced revision: each fact comes back just before you forget it'),
        h('li', {}, 'Web and Android app on the same account')),
      button, msg,
      h('p', { class: 'small' }, 'Paid through Razorpay. Your card and UPI details go to Razorpay, never to us. ',
        h('a', { href: 'refunds/' }, 'Refund Policy'), '.')),
    freePscBanner(),
    h('div', { class: 'panel' }, h('h2', {}, 'What is inside'),
      h('div', { class: 'units' }, state.modules.map((m) =>
        h('div', { class: 'unit' }, h('span', { class: 'n' }, 'UNIT ' + m.module_no), h('h3', {}, m.name))))),
  );
}

async function waitForUnlock(msg) {
  msg.replaceChildren(h('p', { class: 'okmsg' }, 'Payment received. Unlocking your course…'));
  // Access comes from Razorpay's signed webhook, which can take a few seconds.
  for (let i = 0; i < 40; i++) {
    const { data } = await sb.rpc('has_active_subscription', { p_course_id: COURSE });
    if (data === true) { state.paid = true; location.hash = '#/'; return route(); }
    await new Promise((r) => setTimeout(r, 3000));
  }
  msg.replaceChildren(h('p', { class: 'small' },
    'Your payment is being confirmed. Refresh this page in a minute. If the course is still locked, email info@calecutech.com with your payment id.'));
}

// ---------- the guided plan ----------
// The learner never picks a unit, a topic or a mode. Each day the plan decides
// what to revise, which new facts to learn (past-paper facts first, then the
// unit they have covered least), when to check understanding with questions,
// and when a full mock test is due. It asks only two things, now and then: the
// exam date, and whether the daily load feels right. Both live in the user's
// auth metadata (ga_plan), so they follow the account to the app.
const DAY = 86400000;
const BLOCK = 10;            // facts between quick checks
const CHECK_PER_BLOCK = 3;
const PRACTICE = { learn: 10, final: 30 };
const REVIEW_CAP = 100;
const DAILY_CAP = 100;      // facts in one day, revision and new together
const FINAL_DAYS = 7;        // the last week: no new facts, only revision and tests

function today0() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function dayKey(d = new Date()) { return d.toLocaleDateString('en-CA'); }
function parseDay(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function daysBetween(a, b) { return Math.round((b - a) / DAY); }

function prefs() { return state.user?.user_metadata?.ga_plan || {}; }
async function savePrefs(patch) {
  const next = { ...prefs(), ...patch };
  const { data, error } = await sb.auth.updateUser({ data: { ga_plan: next } });
  state.user = !error && data?.user ? data.user : { ...state.user, user_metadata: { ...state.user.user_metadata, ga_plan: next } };
}

// What happened today on this device: new facts started and questions asked,
// so a second visit the same day carries on instead of starting over.
function logKey() { return 'ga-day-' + state.user.id; }
function dayLog() {
  try {
    const l = JSON.parse(localStorage.getItem(logKey()) || 'null');
    if (l?.day === dayKey()) return l;
  } catch { /* storage blocked */ }
  return { day: dayKey(), newIds: [], qIds: [], done: false };
}
function saveLog(l) { try { localStorage.setItem(logKey(), JSON.stringify(l)); } catch { /* storage blocked */ } }

function needsExamDate() {
  const p = prefs();
  if (!p.exam) return true;
  if (p.exam === 'unknown') return !p.askedOn || daysBetween(parseDay(p.askedOn), today0()) >= 14;
  return parseDay(p.exam) < today0(); // the exam date has passed: it may have moved
}

function askExamDate() {
  const p = prefs();
  const moved = p.exam && p.exam !== 'unknown';
  const input = h('input', { type: 'date', id: 'examdate', class: 'date', min: dayKey(new Date(Date.now() + DAY)) });
  const msg = h('p', { class: 'err', hidden: true });
  show(
    h('h1', {}, moved ? 'Has your exam date changed?' : 'When is your exam?'),
    h('p', { class: 'lead' }, 'We plan every study day back from this date: how many new facts to learn, what to revise, and when to sit a full mock test. You will not have to choose anything.'),
    h('div', { class: 'panel' },
      h('label', { class: 'small', for: 'examdate' }, 'Exam date'), input, msg,
      h('div', { class: 'row', style: 'margin-top:14px' },
        h('button', { class: 'btn', onclick: async () => {
          if (!input.value) { msg.hidden = false; msg.textContent = 'Pick the date first.'; return; }
          await savePrefs({ exam: input.value, askedOn: dayKey() });
          home();
        } }, 'Plan my days'),
        h('button', { class: 'btn ghost', onclick: async () => {
          await savePrefs({ exam: 'unknown', askedOn: dayKey() });
          home();
        } }, 'Not announced yet'))),
  );
}

async function buildPlan() {
  const since = new Date(Date.now() - 60 * DAY).toISOString();
  const [cards, seen, attempts] = await Promise.all([
    all(() => sb.from('cards').select('id,module_id,frequency,tier,order_index,source_ref').eq('course_id', COURSE).order('id')),
    all(() => sb.from('user_card_state').select('card_id,ease,interval_days,reps,lapses,due_at').order('card_id')),
    sb.from('quiz_attempts').select('kind,answers,finished_at').eq('course_id', COURSE).gte('started_at', since)
      .order('started_at').limit(300).then(({ data, error }) => { if (error) throw error; return data; }),
  ]);
  const now = Date.now();
  const p = prefs();
  const log = dayLog();
  const stateById = new Map(seen.map((s) => [s.card_id, s]));
  const unseen = cards.filter((c) => !stateById.has(c.id));
  const exam = p.exam && p.exam !== 'unknown' ? parseDay(p.exam) : null;
  const daysLeft = exam ? Math.max(0, daysBetween(today0(), exam)) : null;
  const final = daysLeft != null && daysLeft <= FINAL_DAYS;
  const closing = daysLeft != null && daysLeft <= 21;
  const coverage = cards.length ? (cards.length - unseen.length) / cards.length : 0;

  // Full mock tests: weekly once 40% of the facts are in, every third day in the last three weeks.
  const mocks = attempts.filter((a) => a.kind === 'mock' && a.finished_at).map((a) => Date.parse(a.finished_at));
  const lastMock = mocks.length ? Math.max(...mocks) : null;
  const mockToday = lastMock != null && lastMock >= today0().getTime();
  const mockDue = !mockToday && (coverage >= 0.4 || closing)
    && (lastMock == null || now - lastMock >= (closing ? 3 : 7) * DAY);

  // New facts a day: spread what is left over the days before the final week.
  let perDay = daysLeft != null ? Math.ceil(unseen.length / Math.max(1, daysLeft - FINAL_DAYS)) : NEW_PER_DAY;
  perDay = Math.round(Math.min(60, Math.max(10, perDay)) * (p.pace || 1));
  if (mockDue) perDay = Math.ceil(perDay / 2);

  // Revision: the most overdue first.
  const due = seen.filter((s) => Date.parse(s.due_at) <= now)
    .sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at)).slice(0, REVIEW_CAP);
  // A heavy revision day makes room by taking fewer new facts.
  const newBudget = final ? 0 : Math.max(0, Math.min(unseen.length, perDay - log.newIds.length, DAILY_CAP - due.length));

  // New facts: past-paper facts first, then the most-asked, core tier, textbook
  // order; each pick goes to the unit with the least coverage so far.
  const prio = (a, b) => (!!b.source_ref - !!a.source_ref) || b.frequency - a.frequency || a.tier - b.tier || a.order_index - b.order_index;
  const units = state.modules.map((m) => {
    const mine = cards.filter((c) => c.module_id === m.id);
    return { m, total: mine.length, seen: mine.filter((c) => stateById.has(c.id)).length, queue: mine.filter((c) => !stateById.has(c.id)).sort(prio) };
  });
  const progress = units.map(({ m, total, seen: s }) => ({ m, total, seen: s }));
  const fresh = [];
  while (fresh.length < newBudget) {
    const open = units.filter((u) => u.queue.length);
    if (!open.length) break;
    const pp = open.filter((u) => u.queue[0].source_ref);
    const u = (pp.length ? pp : open).reduce((x, y) => (x.seen / x.total <= y.seen / y.total ? x : y));
    fresh.push(u.queue.shift());
    u.seen += 1;
  }

  // The latest answer to every question, in either shape: web {id: letter}, app [{q, a}].
  const lastAnswer = new Map();
  for (const a of attempts) {
    const ans = a.answers;
    if (Array.isArray(ans)) ans.forEach((x) => x?.q && x.a != null && lastAnswer.set(x.q, String(x.a).toLowerCase()));
    else if (ans && typeof ans === 'object') Object.entries(ans).forEach(([q, v]) => v && lastAnswer.set(q, String(v).toLowerCase()));
  }

  const pastPaper = cards.filter((c) => c.source_ref);
  return {
    cards, stateById, due, fresh, daysLeft, final, mockDue, mockToday, progress, lastAnswer, log,
    learned: cards.length - unseen.length,
    pastPaper: { total: pastPaper.length, learned: pastPaper.filter((c) => stateById.has(c.id)).length },
    practiceSize: final ? PRACTICE.final : PRACTICE.learn,
  };
}

// ---------- home: today's plan, one button ----------
async function home() {
  if (needsExamDate()) return askExamDate();
  show(h('p', { class: 'meta' }, 'Planning your day…'));
  let plan;
  try { plan = await buildPlan(); } catch (e) { return show(errorBox('Could not load your course: ' + e.message)); }
  const { due, fresh, daysLeft, final, mockDue, log } = plan;
  const ppNew = fresh.filter((c) => c.source_ref).length;

  let when;
  if (daysLeft == null) when = `Exam date not announced yet, so we pace you at about ${NEW_PER_DAY} new facts a day.`;
  else if (daysLeft === 0) when = 'Your exam is today. A light revision only. Good luck!';
  else if (final) when = `Exam in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Final week: revision and tests only, no new facts.`;
  else when = `Exam in ${daysLeft} days. We have spread the remaining facts across the days before your final week.`;

  const steps = [];
  const cardsLeft = due.length + fresh.length > 0;
  if (cardsLeft || !log.done) {
    if (due.length) steps.push(`Revise ${due.length} fact${due.length === 1 ? '' : 's'} that you are about to forget`);
    if (fresh.length) steps.push(`Learn ${fresh.length} new fact${fresh.length === 1 ? '' : 's'}` + (ppNew ? `, ${ppNew === fresh.length ? 'all' : ppNew} of them asked in past papers` : ''));
    if (fresh.length + due.length >= BLOCK) steps.push(`A few quick questions after every ${BLOCK} facts`);
    steps.push(`${plan.practiceSize} practice questions, starting with ones you got wrong before`);
  }
  if (mockDue) steps.push(`A full mock test: ${MOCK.count} questions in ${MOCK.minutes} minutes, like the real exam`);

  let todayPanel;
  if (!steps.length) {
    todayPanel = h('div', { class: 'panel' },
      h('h2', {}, 'You are done for today'),
      h('p', {}, 'Everything due today is revised. Come back tomorrow: the next set will be waiting.'),
      h('a', { class: 'btn ghost', href: 'study#/today' }, 'One more round of questions'));
  } else {
    const mockOnly = !cardsLeft && log.done;
    todayPanel = h('div', { class: 'panel' },
      h('h2', {}, log.done ? 'Still on today’s plan' : 'Today’s session'),
      h('ol', { class: 'plan' }, steps.map((s) => h('li', {}, s))),
      h('a', { class: 'btn', href: mockOnly ? 'study#/mock' : 'study#/today' }, mockOnly ? 'Start the mock test' : log.done ? 'Continue' : 'Start'));
  }

  show(
    h('h1', {}, 'Today'),
    h('p', { class: 'lead' }, when),
    todayPanel,
    h('div', { class: 'panel' },
      h('h2', {}, 'Your progress'),
      h('p', {}, h('span', { class: 'big' }, plan.learned), ` of ${plan.cards.length} facts learned  ·  `,
        h('span', { class: 'big' }, plan.pastPaper.learned), ` of ${plan.pastPaper.total} past-paper facts`),
      h('div', { class: 'units' }, plan.progress.map(({ m, total, seen: s }) =>
        h('div', { class: 'unit' },
          h('span', { class: 'n' }, `UNIT ${m.module_no} · ${s}/${total}`),
          h('h3', {}, m.name),
          h('div', { class: 'bar-out' }, h('div', { class: 'bar-in', style: `width:${total ? Math.round((100 * s) / total) : 0}%` })))))),
    h('p', { class: 'small' }, h('a', { href: 'study#/results' }, 'My scores'), '  ·  ',
      h('a', { href: '#', onclick: (e) => { e.preventDefault(); askExamDate(); } }, 'Change exam date'),
      '  ·  Signed in as ' + (state.user.email || '')),
  );
}

// ---------- spaced study ----------
// SM-2, simplified to three answers. "Again" brings the card back in this
// session and tomorrow; "Good" and "Easy" push it out by its growing interval.
function schedule(prev, grade) {
  let { ease = 2.5, interval_days: iv = 0, reps = 0, lapses = 0 } = prev || {};
  if (grade === 'again') { reps = 0; lapses += 1; ease = Math.max(1.3, ease - 0.2); iv = 1; }
  else {
    reps += 1;
    if (grade === 'easy') ease += 0.15;
    iv = reps === 1 ? (grade === 'easy' ? 3 : 1) : reps === 2 ? (grade === 'easy' ? 6 : 3) : Math.round(iv * ease * (grade === 'easy' ? 1.3 : 1));
  }
  return { ease, interval_days: iv, reps, lapses, due_at: new Date(Date.now() + iv * 86400000).toISOString() };
}

async function loadCards(ids) {
  const rows = [];
  for (let i = 0; i < ids.length; i += 60) {
    const { data, error } = await sb.from('cards').select('id,subtopic,statement,reasoning,source_ref,verified').in('id', ids.slice(i, i + 60));
    if (error) throw error;
    rows.push(...data);
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

const back = () => h('a', { href: 'study#/' }, '← Today');

// One fact card; resolves with 'again', 'good' or 'easy'.
function askCard(c, label, isNew) {
  return new Promise((resolve) => {
    const why = h('div', { hidden: true },
      c.reasoning ? h('p', { class: 'why' }, c.reasoning) : null,
      c.source_ref ? h('p', { class: 'small' }, 'Asked in: ' + c.source_ref) : null,
      h('div', { class: 'rate' },
        h('button', { class: 'btn again', onclick: () => resolve('again') }, 'Again'),
        h('button', { class: 'btn', onclick: () => resolve('good') }, 'Got it'),
        h('button', { class: 'btn easy', onclick: () => resolve('easy') }, 'Easy')),
      h('p', { class: 'small' }, h('a', { href: `mailto:info@calecutech.com?subject=${encodeURIComponent('Card mistake: ' + c.id)}` }, 'Report a mistake in this card')));
    const reveal = h('button', { class: 'btn', onclick: () => { why.hidden = false; reveal.remove(); } }, 'Why is this true?');
    show(
      h('div', { class: 'row' }, back(), h('span', { class: 'small', style: 'margin-left:auto' }, label)),
      h('div', { class: 'panel' },
        h('p', { class: 'sub' }, isNew ? h('span', { class: 'tag' }, 'New') : h('span', { class: 'tag rev' }, 'Revise'), ' ', c.subtopic || '',
          c.verified ? null : h('span', { class: 'flag' }, 'Verify before exam')),
        h('p', { class: 'fact' }, c.statement),
        reveal, why),
    );
  });
}

// One question with instant feedback; resolves with the letter picked.
function askQuestion(q, label) {
  return new Promise((resolve) => {
    const right = answerOf(q);
    let picked = null;
    const why = h('div', { class: 'why', hidden: true });
    const nextBtn = h('button', { class: 'btn next', hidden: true, onclick: () => resolve(picked) }, 'Next');
    const opts = options(q).map(([k, text]) => h('button', { class: 'o', onclick: async () => {
      opts.forEach((b) => { b.disabled = true; });
      picked = k;
      if (k !== right) opts[k.charCodeAt(0) - 97].classList.add('bad');
      opts[right.charCodeAt(0) - 97]?.classList.add('good');
      nextBtn.hidden = false;
      const facts = await linkedFacts(q.id);
      if (facts.length) { why.hidden = false; why.replaceChildren(h('strong', {}, 'Facts behind this question'), h('ul', { class: 'linked' }, facts.map((f) => h('li', {}, f)))); }
    } }, `${k.toUpperCase()}. ${text}`));
    show(
      h('div', { class: 'row' }, back(), h('span', { class: 'small', style: 'margin-left:auto' }, label)),
      h('div', { class: 'quiz', style: 'max-width:none' },
        q.paper_code ? h('p', { class: 'src' }, q.paper_code) : null,
        h('p', { class: 'q' }, q.stem), opts, why, nextBtn),
    );
  });
}

function interlude(title, text, button) {
  return new Promise((resolve) => show(
    h('h1', {}, title), h('p', { class: 'lead' }, text),
    h('button', { class: 'btn', onclick: () => resolve() }, button)));
}

async function linkedQuestionIds(cardIds) {
  const out = [];
  for (let i = 0; i < cardIds.length; i += 60) {
    const { data, error } = await sb.from('question_cards').select('question_id').in('card_id', cardIds.slice(i, i + 60));
    if (error) throw error;
    out.push(...data.map((d) => d.question_id));
  }
  return [...new Set(out)];
}

// End-of-session practice: questions you got wrong last time, then questions on
// the facts you just studied, then past-paper questions you have not seen.
async function pickPractice(plan, studied, size) {
  const used = new Set(plan.log.qIds);
  const answered = [...plan.lastAnswer.keys()].filter((id) => !used.has(id)).slice(-300);
  const weak = shuffle((await loadQuestions(answered)).filter((q) => plan.lastAnswer.get(q.id) !== answerOf(q))).slice(0, Math.ceil(size / 2));
  const pick = new Set(weak.map((q) => q.id));
  const add = (ids, fresh) => { for (const id of shuffle(ids)) { if (pick.size >= size) return; if (!used.has(id) && (!fresh || !plan.lastAnswer.has(id))) pick.add(id); } };
  add(await linkedQuestionIds(studied), true);
  if (pick.size < size) add((await all(() => sb.from('questions').select('id').like('id', PREFIX + 'pp-%').order('id'))).map((r) => r.id), true);
  if (pick.size < size) add((await all(() => sb.from('questions').select('id').eq('course_id', COURSE).order('id'))).map((r) => r.id), false);
  const weakIds = new Set(weak.map((q) => q.id));
  return shuffle([...weak, ...(await loadQuestions([...pick].filter((id) => !weakIds.has(id))))]);
}

function checkInDue() { const d = prefs().checkinOn; return !d || daysBetween(parseDay(d), today0()) >= 4; }
function checkIn() {
  return new Promise((resolve) => {
    const pick = async (factor) => {
      const pace = Math.min(2, Math.max(0.5, (prefs().pace || 1) * factor));
      await savePrefs({ pace: Math.round(pace * 100) / 100, checkinOn: dayKey() });
      resolve();
    };
    show(
      h('h1', {}, 'One quick question'),
      h('p', { class: 'lead' }, 'How did today’s session feel? We will adjust how many new facts you get each day.'),
      h('div', { class: 'panel' }, h('div', { class: 'rate' },
        h('button', { class: 'btn again', onclick: () => pick(0.8) }, 'Too much'),
        h('button', { class: 'btn', onclick: () => pick(1) }, 'About right'),
        h('button', { class: 'btn easy', onclick: () => pick(1.25) }, 'I can do more'))),
    );
  });
}

// Today's session: revision, new facts with quick checks, practice, and the mock when it is due.
async function today() {
  show(h('p', { class: 'meta' }, 'Preparing today’s session…'));
  let plan, items;
  try {
    plan = await buildPlan();
    const ids = [...plan.due.map((s) => s.card_id), ...plan.fresh.map((c) => c.id)];
    items = (await loadCards(ids)).map((card) => ({ card, prev: plan.stateById.get(card.id) }));
  } catch (e) { return show(errorBox('Could not prepare your session: ' + e.message)); }
  const { log } = plan;
  const freshIds = new Set(plan.fresh.map((c) => c.id));
  const started = new Date().toISOString();
  const answers = {};
  let correct = 0, wrong = 0;

  async function ask(qs, name) {
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i];
      const k = await askQuestion(q, `${name} · ${i + 1} of ${qs.length}`);
      answers[q.id] = k;
      if (k === answerOf(q)) correct += 1; else wrong += 1;
      log.qIds.push(q.id);
      saveLog(log);
    }
  }
  async function quickCheck(cardIds) {
    const used = new Set(log.qIds);
    const ids = shuffle((await linkedQuestionIds(cardIds)).filter((id) => !used.has(id))).slice(0, CHECK_PER_BLOCK);
    if (ids.length) await ask(await loadQuestions(ids), 'Quick check');
  }

  try {
    const total = items.length;
    const queue = [...items];
    const studied = [];
    let block = [];
    while (queue.length) {
      const { card, prev } = queue.shift();
      const g = await askCard(card, `${studied.length} of ${total} facts`, !prev);
      const s = schedule(prev, g);
      await sb.from('user_card_state').upsert({ user_id: state.user.id, card_id: card.id, ...s, last_reviewed_at: new Date().toISOString() });
      if (freshIds.has(card.id) && !log.newIds.includes(card.id)) { log.newIds.push(card.id); saveLog(log); }
      if (g === 'again') { queue.push({ card, prev: s }); continue; }
      studied.push(card.id);
      block.push(card.id);
      if (block.length >= BLOCK && queue.length) { await quickCheck(block); block = []; }
    }
    if (block.length) await quickCheck(block);

    if (total) await interlude('Facts done', `Now ${plan.practiceSize} practice questions to lock them in.`, 'Start the questions');
    await ask(await pickPractice(plan, studied, plan.practiceSize), 'Practice');
    // Past papers and daily practice are stored as 'unit' attempts with no module.
    if (correct + wrong) await saveAttempt('unit', null, correct + wrong, correct, wrong, correct, answers, started);

    log.done = true;
    saveLog(log);
    if (total >= BLOCK && checkInDue()) await checkIn();
  } catch (e) { return show(errorBox('Something went wrong in this session: ' + e.message)); }

  const score = correct + wrong ? `You answered ${correct} of ${correct + wrong} questions right.` : '';
  if (plan.mockDue) {
    return show(
      h('h1', {}, 'One more step today: a mock test'),
      h('p', { class: 'lead' }, `${score} Now a full mock test: ${MOCK.count} questions, ${MOCK.minutes} minutes, a quarter mark off for each wrong answer. It shows you where you stand.`),
      h('div', { class: 'row' },
        h('a', { class: 'btn', href: 'study#/mock' }, 'I am ready'),
        h('a', { class: 'btn ghost', href: 'study#/' }, 'Later today')));
  }
  show(
    h('h1', {}, 'Done for today'),
    h('p', { class: 'lead' }, `${score} Come back tomorrow: your next set will be ready.`),
    h('a', { class: 'btn', href: 'study#/' }, 'Back to today'));
}

// ---------- questions ----------
async function loadQuestions(ids) {
  const rows = [];
  for (let i = 0; i < ids.length; i += 60) {
    const { data, error } = await sb.from('questions').select('id,paper_code,stem,option_a,option_b,option_c,option_d,official_answer,verified_answer').in('id', ids.slice(i, i + 60));
    if (error) throw error;
    rows.push(...data);
  }
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

async function linkedFacts(questionId) {
  const { data } = await sb.from('question_cards').select('card_id').eq('question_id', questionId);
  if (!data?.length) return [];
  const { data: cards } = await sb.from('cards').select('statement').in('id', data.map((d) => d.card_id));
  return (cards ?? []).map((c) => c.statement);
}

function options(q) { return ['a', 'b', 'c', 'd'].map((k) => [k, q['option_' + k]]); }

async function saveAttempt(kind, moduleId, total, correct, wrong, score, answers, started) {
  await sb.from('quiz_attempts').insert({
    user_id: state.user.id, course_id: COURSE, kind, module_id: moduleId,
    total, correct, wrong, score, answers, started_at: started, finished_at: new Date().toISOString(),
  });
}

// Mock test: exam conditions, no feedback until the end.
async function mock() {
  show(
    h('h1', {}, 'Mock test'),
    h('div', { class: 'panel' },
      h('p', {}, `${MOCK.count} questions from all five units. ${MOCK.minutes} minutes. +1 for a right answer, −¼ for a wrong one, 0 if you leave it blank.`),
      h('p', { class: 'small' }, 'The test submits itself when time runs out. Do not close this tab.'),
      h('button', { class: 'btn', onclick: runMock }, 'Start now')),
  );
}

async function runMock() {
  show(h('p', { class: 'meta' }, 'Setting your paper…'));
  let qs;
  try {
    const ids = (await all(() => sb.from('questions').select('id').eq('course_id', COURSE).order('id'))).map((r) => r.id);
    // Roughly 20 per unit, like the paper's 20 marks per unit.
    const byUnit = {};
    for (const id of shuffle(ids)) (byUnit[unitOfQuestion(id) ?? 0] ||= []).push(id);
    let pick = [];
    for (let u = 1; u <= 5; u++) pick.push(...(byUnit[u] || []).slice(0, MOCK.count / 5));
    if (pick.length < MOCK.count) pick.push(...shuffle(ids.filter((x) => !pick.includes(x))).slice(0, MOCK.count - pick.length));
    qs = await loadQuestions(shuffle(pick));
  } catch (e) { return show(errorBox('Could not set the paper: ' + e.message)); }

  const started = new Date();
  const ends = started.getTime() + MOCK.minutes * 60000;
  const picks = {};
  let i = 0, over = false;
  const timer = h('span', { class: 'timer' });
  const tick = setInterval(() => {
    const left = Math.max(0, ends - Date.now());
    timer.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')} left`;
    if (!left) finish();
  }, 500);
  const leave = (e) => { e.preventDefault(); e.returnValue = ''; };
  window.addEventListener('beforeunload', leave);
  const stopIfLeft = () => { if (!location.hash.startsWith('#/mock')) { clearInterval(tick); window.removeEventListener('beforeunload', leave); window.removeEventListener('hashchange', stopIfLeft); } };
  window.addEventListener('hashchange', stopIfLeft);

  const render = () => {
    const q = qs[i];
    const nav = h('div', { class: 'qnav' }, qs.map((x, n) =>
      h('button', { class: [picks[x.id] ? 'done' : '', n === i ? 'cur' : ''].join(' '), onclick: () => { i = n; render(); } }, n + 1)));
    const opts = options(q).map(([k, text]) => h('button', { class: 'o' + (picks[q.id] === k ? ' pick' : ''), onclick: () => {
      picks[q.id] = picks[q.id] === k ? undefined : k; render();
    } }, `${k.toUpperCase()}. ${text}`));
    show(
      h('div', { class: 'row' }, h('strong', {}, `Question ${i + 1} of ${qs.length}`), h('span', { style: 'margin-left:auto' }, timer)),
      h('div', { class: 'quiz', style: 'max-width:none' }, h('p', { class: 'q' }, q.stem), opts,
        h('p', { class: 'small' }, 'Tap your answer again to clear it.'),
        h('div', { class: 'row' },
          i > 0 ? h('button', { class: 'btn ghost', onclick: () => { i -= 1; render(); } }, 'Previous') : null,
          i + 1 < qs.length ? h('button', { class: 'btn', onclick: () => { i += 1; render(); } }, 'Next') : null,
          h('button', { class: 'btn ghost', onclick: () => { if (confirm('Submit the test now?')) finish(); } }, 'Submit'))),
      nav,
    );
  };

  async function finish() {
    if (over) return;
    over = true;
    clearInterval(tick);
    window.removeEventListener('beforeunload', leave);
    window.removeEventListener('hashchange', stopIfLeft);
    let correct = 0, wrong = 0;
    for (const q of qs) { const p = picks[q.id]; if (!p) continue; if (p === answerOf(q)) correct += 1; else wrong += 1; }
    const score = Math.round((correct - wrong * MOCK.negative) * 100) / 100;
    const clean = Object.fromEntries(Object.entries(picks).filter(([, v]) => v));
    await saveAttempt('mock', null, qs.length, correct, wrong, score, clean, started.toISOString());
    const wrongOnes = qs.filter((q) => picks[q.id] && picks[q.id] !== answerOf(q));
    show(
      h('h1', {}, 'Mock test result'),
      h('div', { class: 'panel' },
        h('p', { class: 'big' }, `${score} / ${qs.length}`),
        h('p', {}, `${correct} right, ${wrong} wrong, ${qs.length - correct - wrong} left blank.`),
        h('a', { class: 'btn', href: 'study#/' }, 'Back to today')),
      wrongOnes.length ? h('div', { class: 'panel' }, h('h2', {}, 'Review your wrong answers'),
        wrongOnes.map((q) => h('div', { style: 'margin:14px 0' },
          h('p', { class: 'q', style: 'font:600 16px/1.45 system-ui,sans-serif;margin:0' }, q.stem),
          h('p', { class: 'small' }, `Your answer: ${picks[q.id].toUpperCase()}. ${q['option_' + picks[q.id]]}`),
          h('p', { class: 'okmsg' }, `Correct: ${answerOf(q).toUpperCase()}. ${q['option_' + answerOf(q)]}`)))) : null,
    );
  }
  render();
}

async function results() {
  const { data, error } = await sb.from('quiz_attempts').select('kind,module_id,total,correct,wrong,score,finished_at')
    .eq('course_id', COURSE).order('finished_at', { ascending: false }).limit(50);
  if (error) return show(errorBox('Could not load your scores: ' + error.message));
  const name = (r) => r.kind === 'mock' ? 'Mock test' : !r.module_id ? 'Practice'
    : 'Unit ' + (state.modules.find((m) => m.id === r.module_id)?.module_no ?? '');
  show(
    h('div', { class: 'row' }, h('a', { href: 'study#/' }, '← Today')),
    h('h1', {}, 'My scores'),
    data.length ? h('table', { class: 'res' },
      h('tr', {}, h('th', {}, 'When'), h('th', {}, 'Test'), h('th', {}, 'Score'), h('th', {}, 'Right / wrong')),
      data.map((r) => h('tr', {},
        h('td', {}, r.finished_at ? new Date(r.finished_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''),
        h('td', {}, name(r)), h('td', {}, `${r.score} / ${r.total}`), h('td', {}, `${r.correct} / ${r.wrong}`))))
      : h('p', {}, 'No scores yet. They appear here after your first session.'),
  );
}

boot().catch((e) => show(errorBox('Something went wrong: ' + e.message)));
