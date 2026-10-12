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
const MOCK = { count: 100, minutes: 75, negative: 1 / 3 };
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
// show() is the normal page; focus() is a study session: full screen, no site
// header or footer, with an action dock fixed under the thumb.
function show(...nodes) { document.body.classList.remove('focus'); app.replaceChildren(...nodes); window.scrollTo(0, 0); }
function focus(...nodes) { document.body.classList.add('focus'); app.replaceChildren(...nodes); window.scrollTo(0, 0); }
function dock(...kids) { return h('div', { class: 'dock' }, h('div', { class: 'dock-in' }, kids)); }
function loading(text) { return h('p', { class: 'loading' }, h('span', { class: 'spin', 'aria-hidden': 'true' }), text); }

// Line icons (fixed markup, never data).
const ICONS = {
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  revise: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  left: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
};
function icon(name) {
  const s = h('span', { class: 'ico', 'aria-hidden': 'true' });
  s.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return s;
}
// Top bar of a study session: close, progress, count.
function sessionBar(done, total, right) {
  const pct = total ? Math.min(100, Math.round((100 * done) / total)) : 0;
  return h('div', { class: 'sbar' },
    h('a', { class: 'x', href: 'study#/', 'aria-label': 'Leave the session' }, icon('x')),
    h('div', { class: 'prog', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done }, h('i', { style: `width:${pct}%` })),
    right);
}
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
function rupees(minor) { return '₹' + (minor / 100).toLocaleString('en-IN'); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function unitOfQuestion(id) { const m = id.slice(PREFIX.length).match(/^u(\d)/); return m ? +m[1] : null; }
function answerOf(q) { return (q.verified_answer || q.official_answer || '').trim().toLowerCase(); }
function errorBox(msg) { return h('p', { class: 'err', role: 'alert' }, msg); }

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

// ---------- sign in ----------
function signIn() {
  const msg = h('p', { class: 'err', hidden: true });
  const g = h('span', { 'aria-hidden': 'true' });
  g.innerHTML = '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  show(h('div', { class: 'center' },
    h('div', { class: 'emblem' }, icon('book')),
    h('h1', {}, 'Sign in to your course'),
    h('p', { class: 'lead' }, 'Use the same Google account on the web and in the app. Your progress follows you.'),
    h('button', { class: 'gbtn', onclick: async () => {
      const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: HOME } });
      if (error) { msg.hidden = false; msg.textContent = 'Could not open Google sign-in: ' + error.message; }
    } }, g, 'Continue with Google'),
    msg,
    h('p', { class: 'small', style: 'margin-top:18px' }, 'We use your name and email only to run your account. See the ',
      h('a', { href: 'privacy/' }, 'Privacy Policy'), '.')));
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
  const button = h('button', { class: 'btn big block', onclick: pay }, 'Pay ' + rupees(price) + ' by UPI, card or netbanking');

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

  const perk = (t) => h('li', {}, icon('check'), h('span', {}, t));
  show(h('div', { class: 'center' },
    h('div', { class: 'emblem' }, icon('lock')),
    h('h1', {}, 'Unlock the full course'),
    h('p', { class: 'small' }, 'Signed in as ' + (state.user.email || '')),
    h('div', { class: 'card', style: 'margin-top:18px' },
      h('p', { class: 'price' }, rupees(price), h('small', {}, 'one-time, lifetime access')),
      h('ul', { class: 'perks' },
        perk('1,854 fact cards with the reason behind each fact'),
        perk('1,212 practice questions and timed mock tests'),
        perk('A daily plan: each fact comes back just before you forget it'),
        perk('Web and Android app on the same account')),
      button, msg,
      h('p', { class: 'small', style: 'margin:14px 0 0' }, 'Paid through Razorpay. Your card and UPI details go to Razorpay, never to us. ',
        h('a', { href: 'refunds/' }, 'Refund Policy'), '.'))),
    h('div', { class: 'section-title' }, h('h2', {}, 'What is inside')),
    h('div', { class: 'units' }, state.modules.map((m) =>
      h('div', { class: 'urow' }, h('span', { class: 'no' }, m.module_no), h('h3', {}, m.name), h('span')))),
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
  show(h('div', { class: 'center' },
    h('div', { class: 'emblem' }, icon('calendar')),
    h('h1', {}, moved ? 'Has your exam date changed?' : 'When is your exam?'),
    h('p', { class: 'lead' }, 'We plan every study day back from this date: what to learn, what to revise, and when to sit a full mock test. You will not have to choose anything.'),
    h('label', { class: 'fl', for: 'examdate' }, 'Exam date'), input, msg,
    h('div', { class: 'stack' },
      h('button', { class: 'btn big block', onclick: async () => {
        if (!input.value) { msg.hidden = false; msg.textContent = 'Pick the date first.'; return; }
        await savePrefs({ exam: input.value, askedOn: dayKey() });
        home();
      } }, 'Plan my days'),
      h('button', { class: 'btn ghost block', onclick: async () => {
        await savePrefs({ exam: 'unknown', askedOn: dayKey() });
        home();
      } }, 'Not announced yet'))));
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
function greeting() {
  const hr = new Date().getHours();
  const part = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const first = (state.user.user_metadata?.full_name || state.user.user_metadata?.name || '').split(' ')[0];
  return first ? `${part}, ${first}` : part;
}

function ring(pct) {
  const r = 40, c = 2 * Math.PI * r;
  const el = h('div', { class: 'ring', role: 'img', 'aria-label': `${pct}% of the course learned` });
  el.innerHTML = `<svg viewBox="0 0 92 92"><circle class="trk" cx="46" cy="46" r="${r}"/><circle class="val" cx="46" cy="46" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg>`;
  el.append(h('b', {}, `${pct}%`, h('span', {}, 'learned')));
  return el;
}

async function home() {
  if (needsExamDate()) return askExamDate();
  show(loading('Planning your day…'));
  let plan;
  try { plan = await buildPlan(); } catch (e) { return show(errorBox('Could not load your course: ' + e.message)); }
  const { due, fresh, daysLeft, final, mockDue, log } = plan;
  const ppNew = fresh.filter((c) => c.source_ref).length;

  let count, when;
  if (daysLeft == null) { count = null; when = `Exam date not announced yet, so we pace you at about ${NEW_PER_DAY} new facts a day.`; }
  else if (daysLeft === 0) { count = 'Today'; when = 'Your exam is today. A light revision only. Good luck!'; }
  else if (final) { count = daysLeft; when = 'Final week: revision and tests only, no new facts.'; }
  else { count = daysLeft; when = 'We have spread the remaining facts across the days before your final week.'; }

  // Each step: [class, icon, title, detail].
  const steps = [];
  const cardsLeft = due.length + fresh.length > 0;
  let qCount = 0;
  if (cardsLeft || !log.done) {
    if (due.length) steps.push(['rev', 'revise', `Revise ${plural(due.length, 'fact')}`, 'The ones you are about to forget']);
    if (fresh.length) steps.push(['new', 'spark', `Learn ${plural(fresh.length, 'new fact')}`,
      ppNew ? `${ppNew === fresh.length ? 'All' : ppNew} of them asked in past papers` : 'Picked from the unit you have covered least']);
    if (fresh.length + due.length >= BLOCK) {
      steps.push(['chk', 'help', 'Quick checks', `${CHECK_PER_BLOCK} questions after every ${BLOCK} facts`]);
      qCount += Math.floor((fresh.length + due.length) / BLOCK) * CHECK_PER_BLOCK;
    }
    steps.push(['prac', 'pencil', `${plan.practiceSize} practice questions`, 'Starting with ones you got wrong before']);
    qCount += plan.practiceSize;
  }
  if (mockDue) steps.push(['mock', 'clock', 'Full mock test', `${MOCK.count} questions in ${MOCK.minutes} minutes, like the real exam`]);
  // A rough guide: about 15 seconds a fact and 40 a question, plus the mock.
  const minutes = Math.round(((due.length + fresh.length) * 15 + qCount * 40) / 60) + (mockDue ? MOCK.minutes : 0);

  let todayPanel;
  if (!steps.length) {
    todayPanel = h('div', { class: 'card done-today' },
      h('div', { class: 'badge' }, icon('check')),
      h('h2', {}, 'You are done for today'),
      h('p', { class: 'small' }, 'Everything due today is revised. Come back tomorrow: the next set will be waiting.'),
      h('a', { class: 'btn ghost block', href: 'study#/today', style: 'margin-top:14px' }, 'One more round of questions'));
  } else {
    const mockOnly = !cardsLeft && log.done;
    todayPanel = h('div', { class: 'card session' },
      h('div', { class: 'head' },
        h('h2', {}, log.done ? 'Still on today’s plan' : 'Today’s session'),
        minutes ? h('span', { class: 'chip' }, icon('clock'), `about ${minutes} min`) : null),
      h('ol', { class: 'steps' }, steps.map(([cls, ic, title, detail]) =>
        h('li', { class: cls }, h('span', { class: 'dot' }, icon(ic)), h('div', {}, h('b', {}, title), h('span', { class: 'd' }, detail))))),
      h('a', { class: 'btn big block', href: mockOnly ? 'study#/mock' : 'study#/today' },
        mockOnly ? 'Start the mock test' : log.done ? 'Continue' : 'Start today’s session'));
  }

  const pct = plan.cards.length ? Math.round((100 * plan.learned) / plan.cards.length) : 0;
  const ppPct = plan.pastPaper.total ? Math.round((100 * plan.pastPaper.learned) / plan.pastPaper.total) : 0;
  const dateLine = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  show(
    h('div', { class: 'hello' }, h('p', { class: 'over' }, dateLine), h('h1', {}, greeting())),
    h('div', { class: 'hero' },
      h('div', { class: 'txt' },
        count == null ? h('div', { class: 'count', style: 'font-size:22px' }, 'Exam date not set')
          : h('div', { class: 'count' }, count, typeof count === 'number' ? h('small', {}, daysLeft === 1 ? 'day to go' : 'days to go') : null),
        h('p', {}, when)),
      ring(pct)),
    todayPanel,
    h('div', { class: 'section-title' }, h('h2', {}, 'Your progress'), h('a', { class: 'link', href: 'study#/results' }, 'My scores')),
    h('div', { class: 'tiles' },
      h('div', { class: 'tile' }, h('div', { class: 'n' }, plan.learned.toLocaleString('en-IN'), h('small', {}, ' / ' + plan.cards.length.toLocaleString('en-IN'))),
        h('div', { class: 'l' }, 'facts learned'), h('div', { class: 'meter' }, h('i', { style: `width:${pct}%` }))),
      h('div', { class: 'tile' }, h('div', { class: 'n' }, plan.pastPaper.learned, h('small', {}, ' / ' + plan.pastPaper.total)),
        h('div', { class: 'l' }, 'past-paper facts'), h('div', { class: 'meter good' }, h('i', { style: `width:${ppPct}%` })))),
    h('div', { class: 'units' }, plan.progress.map(({ m, total, seen: s }) =>
      h('div', { class: 'urow' },
        h('span', { class: 'no', 'aria-label': 'Unit ' + m.module_no }, m.module_no),
        h('h3', {}, m.name),
        h('span', { class: 'c' }, `${s} / ${total}`),
        h('div', { class: 'meter' }, h('i', { style: `width:${total ? Math.round((100 * s) / total) : 0}%` }))))),
    h('div', { class: 'links' },
      h('a', { class: 'link', href: '#', onclick: (e) => { e.preventDefault(); askExamDate(); } }, 'Change exam date')),
    h('p', { class: 'who' }, 'Signed in as ' + (state.user.email || '')),
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

function days(n) { return n <= 1 ? 'tomorrow' : `in ${n} days`; }

// One fact card; resolves with 'again', 'good' or 'easy'.
function askCard(c, done, total, prev) {
  const isNew = !prev;
  return new Promise((resolve) => {
    const rateBtn = (grade, cls, label, sub) => h('button', { class: cls, onclick: () => resolve(grade) }, label, h('small', {}, sub));
    const rate = h('div', { class: 'rate' },
      rateBtn('again', 'again', 'Again', 'show it again'),
      rateBtn('good', 'good', 'Got it', days(schedule(prev, 'good').interval_days)),
      rateBtn('easy', 'easy', 'Easy', days(schedule(prev, 'easy').interval_days)));
    const why = h('div', { hidden: true },
      c.reasoning ? h('div', { class: 'why' }, h('div', { class: 'lbl' }, icon('bulb'), 'Why it is true'), h('p', {}, c.reasoning)) : null,
      c.source_ref ? h('p', { class: 'src' }, icon('book'), h('span', {}, 'Asked in ' + c.source_ref)) : null);
    const hint = h('p', { class: 'hint' }, 'How well did you know it?');
    const reveal = h('button', { class: 'btn big block', onclick: () => {
      why.hidden = false;
      reveal.replaceWith(hint, rate);
    } }, c.reasoning ? 'Why is this true?' : 'Next');
    focus(
      sessionBar(done, total, h('span', { class: 'cnt' }, `${done + 1} / ${total}`)),
      h('div', { class: 'fact-card' + (isNew ? '' : ' rev') },
        h('div', { class: 'kind' },
          isNew ? h('span', { class: 'chip brand' }, icon('spark'), 'New fact') : h('span', { class: 'chip good' }, icon('revise'), 'Revision'),
          c.verified ? null : h('span', { class: 'chip warn' }, icon('flag'), 'Verify before exam')),
        c.subtopic ? h('p', { class: 'topic' }, c.subtopic) : null,
        h('p', { class: 'fact' }, c.statement),
        why,
        h('a', { class: 'report', href: `mailto:info@calecutech.com?subject=${encodeURIComponent('Card mistake: ' + c.id)}` }, 'Report a mistake in this card')),
      dock(reveal),
    );
  });
}

// One question with instant feedback; resolves with the letter picked.
function askQuestion(q, kind, n, total) {
  return new Promise((resolve) => {
    const right = answerOf(q);
    let picked = null;
    const linked = h('div', { hidden: true });
    const verdict = h('div', { hidden: true });
    const nextBtn = h('button', { class: 'btn big block', hidden: true, onclick: () => resolve(picked) }, 'Next');
    const hint = h('p', { class: 'hint' }, 'Tap the answer you think is right');
    const opts = options(q).map(([k, text]) => h('button', { class: 'o', onclick: async () => {
      opts.forEach((b) => { b.disabled = true; });
      picked = k;
      const ok = k === right;
      opts.forEach((b, j) => {
        const letter = String.fromCharCode(97 + j);
        if (letter === right) { b.classList.add('good'); b.append(icon('check')); }
        else if (letter === k) { b.classList.add('bad'); b.append(icon('x')); }
        else b.classList.add('dim');
      });
      verdict.className = 'verdict ' + (ok ? 'good' : 'bad');
      verdict.replaceChildren(icon(ok ? 'check' : 'x'), ok ? 'Correct' : 'Not quite', ok ? null : h('span', {}, `The answer is ${right.toUpperCase()}`));
      verdict.hidden = false;
      hint.hidden = true;
      nextBtn.hidden = false;
      nextBtn.focus({ preventScroll: true });
      const facts = await linkedFacts(q.id);
      if (facts.length) { linked.hidden = false; linked.replaceChildren(h('div', { class: 'linked' }, h('p', { class: 'lbl' }, 'Facts behind this question'), h('ul', {}, facts.map((f) => h('li', {}, f))))); }
    } }, h('span', { class: 'k' }, k.toUpperCase()), h('span', { class: 't' }, text)));
    focus(
      sessionBar(n, total, h('span', { class: 'cnt' }, `${n + 1} / ${total}`)),
      h('div', { class: 'qcard' },
        h('div', { class: 'kind' }, h('span', { class: 'chip brand' }, icon(kind === 'Quick check' ? 'help' : 'pencil'), kind),
          q.paper_code ? h('span', { class: 'chip' }, icon('book'), q.paper_code) : null),
        h('p', { class: 'stem' }, q.stem), h('div', { class: 'opts' }, opts), linked),
      dock(hint, verdict, nextBtn),
    );
  });
}

function interlude(title, text, button, ic = 'pencil') {
  return new Promise((resolve) => show(h('div', { class: 'center' },
    h('div', { class: 'emblem' }, icon(ic)),
    h('h1', {}, title), h('p', { class: 'lead' }, text),
    h('button', { class: 'btn big block', onclick: () => resolve() }, button))));
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
    show(h('div', { class: 'center' },
      h('div', { class: 'emblem' }, icon('smile')),
      h('h1', {}, 'One quick question'),
      h('p', { class: 'lead' }, 'How did today’s session feel? We will adjust how many new facts you get each day.'),
      h('div', { class: 'rate' },
        h('button', { class: 'again', onclick: () => pick(0.8) }, 'Too much', h('small', {}, 'fewer facts')),
        h('button', { class: 'good', onclick: () => pick(1) }, 'About right', h('small', {}, 'keep it')),
        h('button', { class: 'easy', onclick: () => pick(1.25) }, 'I can do more', h('small', {}, 'more facts')))));
  });
}

// Today's session: revision, new facts with quick checks, practice, and the mock when it is due.
async function today() {
  show(loading('Preparing today’s session…'));
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
      const k = await askQuestion(q, name, i, qs.length);
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
      const g = await askCard(card, studied.length, total, prev);
      const s = schedule(prev, g);
      await sb.from('user_card_state').upsert({ user_id: state.user.id, card_id: card.id, ...s, last_reviewed_at: new Date().toISOString() });
      if (freshIds.has(card.id) && !log.newIds.includes(card.id)) { log.newIds.push(card.id); saveLog(log); }
      if (g === 'again') { queue.push({ card, prev: s }); continue; }
      studied.push(card.id);
      block.push(card.id);
      if (block.length >= BLOCK && queue.length) { await quickCheck(block); block = []; }
    }
    if (block.length) await quickCheck(block);

    if (total) await interlude('Facts done', `Now ${plan.practiceSize} practice questions to lock them in.`, 'Start the questions', 'check');
    await ask(await pickPractice(plan, studied, plan.practiceSize), 'Practice');
    // Past papers and daily practice are stored as 'unit' attempts with no module.
    if (correct + wrong) await saveAttempt('unit', null, correct + wrong, correct, wrong, correct, answers, started);

    log.done = true;
    saveLog(log);
    if (total >= BLOCK && checkInDue()) await checkIn();
  } catch (e) { return show(errorBox('Something went wrong in this session: ' + e.message)); }

  const asked = correct + wrong;
  const scoreCard = asked ? h('div', { class: 'card' },
    h('p', { class: 'over' }, 'Today’s questions'),
    h('p', { class: 'bigscore' }, correct, h('small', {}, ` / ${asked} right`)),
    h('div', { class: 'meter good' }, h('i', { style: `width:${Math.round((100 * correct) / asked)}%` }))) : null;
  if (plan.mockDue) {
    return show(h('div', { class: 'center' },
      h('div', { class: 'emblem ink' }, icon('clock')),
      h('h1', {}, 'One more step today: a mock test'),
      h('p', { class: 'lead' }, `${MOCK.count} questions, ${MOCK.minutes} minutes, one third of a mark off for each wrong answer. It shows you where you stand.`),
      scoreCard,
      h('div', { class: 'stack' },
        h('a', { class: 'btn big block', href: 'study#/mock' }, 'I am ready'),
        h('a', { class: 'btn ghost block', href: 'study#/' }, 'Later today'))));
  }
  show(h('div', { class: 'center' },
    h('div', { class: 'emblem good' }, icon('award')),
    h('h1', {}, 'Done for today'),
    h('p', { class: 'lead' }, 'Come back tomorrow: your next set will be ready.'),
    scoreCard,
    h('div', { class: 'stack' }, h('a', { class: 'btn big block', href: 'study#/' }, 'Back to today'))));
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
  show(h('div', { class: 'center' },
    h('div', { class: 'emblem ink' }, icon('clock')),
    h('h1', {}, 'Mock test'),
    h('p', { class: 'lead' }, 'Exam conditions. You see your score and every wrong answer at the end.'),
    h('div', { class: 'trio', style: 'margin-bottom:6px' },
      h('div', {}, h('b', {}, MOCK.count), h('span', {}, 'questions')),
      h('div', {}, h('b', {}, MOCK.minutes), h('span', {}, 'minutes')),
      h('div', {}, h('b', {}, '−⅓'), h('span', {}, 'per wrong'))),
    h('p', { class: 'small', style: 'margin-top:14px' }, 'Questions come from all five units. +1 for a right answer, 0 if you leave it blank. The test submits itself when time runs out, so keep this tab open.'),
    h('div', { class: 'stack' },
      h('button', { class: 'btn big block', onclick: runMock }, 'Start now'),
      h('a', { class: 'btn ghost block', href: 'study#/' }, 'Not now'))));
}

async function runMock() {
  show(loading('Setting your paper…'));
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
  let i = 0, over = false, navOpen = false;
  const clock = h('span');
  const timer = h('span', { class: 'timer', 'aria-label': 'Time left' }, icon('clock'), clock);
  const tick = setInterval(() => {
    const left = Math.max(0, ends - Date.now());
    clock.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`;
    timer.classList.toggle('low', left < 5 * 60000);
    if (!left) finish();
  }, 500);
  const leave = (e) => { e.preventDefault(); e.returnValue = ''; };
  window.addEventListener('beforeunload', leave);
  const stopIfLeft = () => { if (!location.hash.startsWith('#/mock')) { clearInterval(tick); window.removeEventListener('beforeunload', leave); window.removeEventListener('hashchange', stopIfLeft); } };
  window.addEventListener('hashchange', stopIfLeft);

  const render = () => {
    const q = qs[i];
    const answered = qs.filter((x) => picks[x.id]).length;
    const nav = h('details', { class: 'qnav', open: navOpen, ontoggle: (e) => { navOpen = e.target.open; } },
      h('summary', {}, icon('grid'), `All questions · ${answered} of ${qs.length} answered`),
      h('div', { class: 'grid' }, qs.map((x, n) =>
        h('button', { class: [picks[x.id] ? 'done' : '', n === i ? 'cur' : ''].join(' '), 'aria-label': `Question ${n + 1}`, onclick: () => { i = n; render(); } }, n + 1))));
    const opts = options(q).map(([k, text]) => h('button', { class: 'o' + (picks[q.id] === k ? ' pick' : ''), 'aria-pressed': String(picks[q.id] === k), onclick: () => {
      picks[q.id] = picks[q.id] === k ? undefined : k; render();
    } }, h('span', { class: 'k' }, k.toUpperCase()), h('span', { class: 't' }, text)));
    const bar = sessionBar(answered, qs.length, timer);
    bar.querySelector('.x').addEventListener('click', (e) => { if (!confirm('Leave the mock test? Your answers will not be saved.')) e.preventDefault(); });
    focus(
      bar,
      h('div', { class: 'qcard' },
        h('div', { class: 'kind' }, h('span', { class: 'chip' }, `Question ${i + 1} of ${qs.length}`)),
        h('p', { class: 'stem' }, q.stem), h('div', { class: 'opts' }, opts),
        h('p', { class: 'tapnote' }, 'Tap your answer again to clear it.')),
      nav,
      dock(
        h('div', { class: 'mocknav' + (i > 0 ? '' : ' solo') },
          i > 0 ? h('button', { class: 'btn ghost', onclick: () => { i -= 1; render(); } }, 'Previous') : null,
          i + 1 < qs.length ? h('button', { class: 'btn', onclick: () => { i += 1; render(); } }, 'Next')
            : h('button', { class: 'btn', onclick: () => { if (confirm('Submit the test now?')) finish(); } }, 'Submit test')),
        i + 1 < qs.length ? h('div', { class: 'submit-row' }, h('button', { class: 'link', onclick: () => { if (confirm('Submit the test now?')) finish(); } }, 'Submit now')) : null),
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
    show(h('div', { class: 'center' },
      h('div', { class: 'emblem good' }, icon('award')),
      h('h1', {}, 'Mock test result'),
      h('div', { class: 'card', style: 'text-align:center' },
        h('p', { class: 'bigscore' }, score, h('small', {}, ` / ${qs.length}`)),
        h('div', { class: 'trio' },
          h('div', { class: 'g' }, h('b', {}, correct), h('span', {}, 'right')),
          h('div', { class: 'r' }, h('b', {}, wrong), h('span', {}, 'wrong')),
          h('div', {}, h('b', {}, qs.length - correct - wrong), h('span', {}, 'blank')))),
      h('div', { class: 'stack' }, h('a', { class: 'btn big block', href: 'study#/' }, 'Back to today')),
      wrongOnes.length ? h('div', { class: 'review' }, h('div', { class: 'section-title' }, h('h2', {}, 'Review your wrong answers')),
        wrongOnes.map((q) => h('div', { class: 'item' },
          h('p', { class: 'q' }, q.stem),
          h('p', { class: 'yours' }, `Your answer: ${picks[q.id].toUpperCase()}. ${q['option_' + picks[q.id]]}`),
          h('p', { class: 'right' }, `Correct: ${answerOf(q).toUpperCase()}. ${q['option_' + answerOf(q)]}`)))) : null));
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
    h('a', { class: 'back', href: 'study#/' }, icon('left'), 'Today'),
    h('h1', {}, 'My scores'),
    data.length ? h('div', { class: 'scores' }, data.map((r) => h('div', { class: 'score' + (r.kind === 'mock' ? ' mock' : '') },
      h('span', { class: 'ic' }, icon(r.kind === 'mock' ? 'clock' : 'pencil')),
      h('div', { class: 'm' }, h('b', {}, name(r)),
        h('span', {}, (r.finished_at ? new Date(r.finished_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' · ' : '') + `${r.correct} right, ${r.wrong} wrong`)),
      h('div', { class: 'v' }, r.score, h('span', {}, 'of ' + r.total)))))
      : h('div', { class: 'card done-today' }, h('p', { class: 'small', style: 'margin:0' }, 'No scores yet. They appear here after your first session.')),
  );
}

boot().catch((e) => show(errorBox('Something went wrong: ' + e.message)));
