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
const UNIT_QUIZ_SIZE = 20;
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
  const [, page, arg] = (location.hash || '#/').split('/');
  if (!state.user) return signIn();
  // Invoices stay readable after a refund, when the course itself is locked.
  if (page === 'invoices') return invoices();
  if (page === 'invoice') return invoice(arg);
  if (!state.paid) return buy();
  if (page === 'study') return study(arg ? +arg : null);
  if (page === 'quiz') return quiz(arg);
  if (page === 'mock') return mock();
  if (page === 'results') return results();
  return dashboard();
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
  // Billing details for the GST invoice. The state is the place of supply.
  const stateSel = h('select', { id: 'bill-state' },
    STATES.map(([code, name]) => h('option', { value: code, selected: code === '32' }, name)));
  const nameIn = h('input', { id: 'bill-name', autocomplete: 'name', maxlength: 120,
    value: state.user.user_metadata?.full_name || '' });
  const gstinIn = h('input', { id: 'bill-gstin', maxlength: 15, placeholder: '32ABCDE1234F1Z5', style: 'text-transform:uppercase' });
  const billing = h('div', { class: 'bill' },
    h('label', { for: 'bill-name' }, 'Name on invoice'), nameIn,
    h('label', { for: 'bill-state' }, 'Your state'), stateSel,
    h('details', {}, h('summary', {}, 'Buying for a business? Add your GSTIN'),
      h('label', { for: 'bill-gstin' }, 'GSTIN'), gstinIn));

  async function pay() {
    button.disabled = true;
    msg.replaceChildren();
    try {
      await loadRazorpay();
      const gstin = gstinIn.value.trim().toUpperCase();
      if (gstin && !GSTIN.test(gstin)) throw new Error('That GSTIN does not look right. Leave it empty if you are not buying for a business.');
      const { data, error } = await sb.functions.invoke('ga-razorpay-create-order', { body: {
        courseId: COURSE,
        billing: { name: nameIn.value.trim(), stateCode: gstin ? gstin.slice(0, 2) : stateSel.value, gstin },
      } });
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
      h('p', { class: 'big' }, rupees(price), h('span', { class: 'small' }, '  one-time, lifetime access, inclusive of all taxes')),
      h('ul', {},
        h('li', {}, '1,854 fact cards with the reason behind each fact'),
        h('li', {}, '1,212 practice questions, unit quizzes and timed mock tests'),
        h('li', {}, 'Spaced revision: each fact comes back just before you forget it'),
        h('li', {}, 'Web and Android app on the same account')),
      billing, button, msg,
      h('p', { class: 'small' }, 'You get an invoice under My invoices as soon as the payment is confirmed. Paid through Razorpay. Your card and UPI details go to Razorpay, never to us. ',
        h('a', { href: 'refunds/' }, 'Refund Policy'), '.')),
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

// ---------- dashboard ----------
async function dashboard() {
  show(h('p', { class: 'meta' }, 'Loading your progress…'));
  let cards, seen;
  try {
    [cards, seen] = await Promise.all([
      all(() => sb.from('cards').select('id,module_id').eq('course_id', COURSE).order('id')),
      all(() => sb.from('user_card_state').select('card_id,due_at').order('card_id')),
    ]);
  } catch (e) { return show(errorBox('Could not load your course: ' + e.message)); }

  const now = Date.now();
  const seenSet = new Set(seen.map((s) => s.card_id));
  const due = seen.filter((s) => Date.parse(s.due_at) <= now).length;
  const perUnit = state.modules.map((m) => {
    const ids = cards.filter((c) => c.module_id === m.id);
    return { m, total: ids.length, seen: ids.filter((c) => seenSet.has(c.id)).length };
  });
  const newLeft = cards.length - seenSet.size;

  show(
    h('h1', {}, 'Your course'),
    h('p', { class: 'small' }, 'Signed in as ' + (state.user.email || '')),
    h('div', { class: 'panel' },
      h('h2', {}, "Today's study"),
      h('p', {}, h('span', { class: 'big' }, due), ' reviews due  ·  ',
        h('span', { class: 'big' }, Math.min(NEW_PER_DAY, newLeft)), ' new cards'),
      h('p', { class: 'small' }, `${seenSet.size} of ${cards.length} cards started.`),
      h('a', { class: 'btn', href: 'study#/study' }, due + newLeft > 0 ? 'Start today’s session' : 'All done. Review anyway')),
    h('div', { class: 'panel' },
      h('h2', {}, 'Mock test'),
      h('p', { class: 'small' }, `${MOCK.count} questions, ${MOCK.minutes} minutes, one third of a mark off for each wrong answer. Like the real exam.`),
      h('div', { class: 'row' },
        h('a', { class: 'btn', href: 'study#/mock' }, 'Start a mock test'),
        h('a', { class: 'btn ghost', href: 'study#/quiz/pp' }, 'Past-paper questions'),
        h('a', { class: 'btn ghost', href: 'study#/results' }, 'My scores'),
        h('a', { class: 'btn ghost', href: 'study#/invoices' }, 'My invoices'))),
    h('h2', { style: 'margin-top:26px' }, 'Units'),
    h('div', { class: 'units' }, perUnit.map(({ m, total, seen: s }) =>
      h('div', { class: 'unit' },
        h('span', { class: 'n' }, `UNIT ${m.module_no} · ${s}/${total} cards`),
        h('h3', {}, m.name),
        h('div', { class: 'bar-out' }, h('div', { class: 'bar-in', style: `width:${total ? Math.round((100 * s) / total) : 0}%` })),
        h('div', { class: 'row' },
          h('a', { class: 'btn sm', href: `study#/study/${m.module_no}` }, 'Study this unit'),
          h('a', { class: 'btn sm ghost', href: `study#/quiz/${m.module_no}` }, 'Unit quiz'))))),
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

async function study(unitNo) {
  show(h('p', { class: 'meta' }, 'Preparing your session…'));
  const unit = unitNo ? state.modules.find((m) => m.module_no === unitNo) : null;
  let queue;
  try {
    const seen = await all(() => sb.from('user_card_state').select('card_id,ease,interval_days,reps,lapses,due_at').order('card_id'));
    const stateById = new Map(seen.map((s) => [s.card_id, s]));
    let meta = await all(() => {
      let q = sb.from('cards').select('id,module_id,frequency,tier,order_index').eq('course_id', COURSE).order('id');
      return unit ? q.eq('module_id', unit.id) : q;
    });
    const now = Date.now();
    const due = meta.filter((c) => stateById.has(c.id) && Date.parse(stateById.get(c.id).due_at) <= now);
    // New cards: most-asked facts first, then core tier, then textbook order.
    const fresh = meta.filter((c) => !stateById.has(c.id))
      .sort((a, b) => b.frequency - a.frequency || a.tier - b.tier || a.order_index - b.order_index)
      .slice(0, NEW_PER_DAY);
    let ids = [...due.slice(0, 100), ...fresh].map((c) => c.id);
    if (!ids.length) ids = shuffle(meta.filter((c) => stateById.has(c.id))).slice(0, 20).map((c) => c.id);
    if (!ids.length) return show(h('h1', {}, 'Nothing to study here yet'), h('a', { class: 'btn', href: 'study#/' }, 'Back'));
    const rows = [];
    for (let i = 0; i < ids.length; i += 60) {
      const { data, error } = await sb.from('cards').select('id,subtopic,statement,reasoning,source_ref,verified').in('id', ids.slice(i, i + 60));
      if (error) throw error;
      rows.push(...data);
    }
    const byId = new Map(rows.map((r) => [r.id, r]));
    queue = ids.map((id) => ({ card: byId.get(id), prev: stateById.get(id) })).filter((x) => x.card);
  } catch (e) { return show(errorBox('Could not load cards: ' + e.message)); }

  const total = queue.length;
  let done = 0;
  const next = () => {
    if (!queue.length) {
      return show(h('h1', {}, 'Session complete'), h('p', { class: 'lead' }, `You went through ${total} cards. Come back tomorrow for the next set.`),
        h('a', { class: 'btn', href: 'study#/' }, 'Back to my course'));
    }
    const item = queue.shift();
    const c = item.card;
    const why = h('div', { hidden: true },
      c.reasoning ? h('p', { class: 'why' }, c.reasoning) : null,
      c.source_ref ? h('p', { class: 'small' }, 'Asked in: ' + c.source_ref) : null,
      h('div', { class: 'rate' },
        h('button', { class: 'btn again', onclick: () => grade('again') }, 'Again'),
        h('button', { class: 'btn', onclick: () => grade('good') }, 'Got it'),
        h('button', { class: 'btn easy', onclick: () => grade('easy') }, 'Easy')),
      h('p', { class: 'small' }, h('a', { href: `mailto:info@calecutech.com?subject=${encodeURIComponent('Card mistake: ' + c.id)}` }, 'Report a mistake in this card')));
    const reveal = h('button', { class: 'btn', onclick: () => { why.hidden = false; reveal.remove(); } }, 'Why is this true?');

    async function grade(g) {
      const s = schedule(item.prev, g);
      await sb.from('user_card_state').upsert({ user_id: state.user.id, card_id: c.id, ...s, last_reviewed_at: new Date().toISOString() });
      if (g === 'again') queue.push({ card: c, prev: s });
      else done += 1;
      next();
    }

    show(
      h('div', { class: 'row' }, h('a', { href: 'study#/' }, '← My course'), h('span', { class: 'small', style: 'margin-left:auto' }, `${done} of ${total} done`)),
      h('div', { class: 'panel' },
        h('p', { class: 'sub' }, c.subtopic || '', c.verified ? null : h('span', { class: 'flag' }, 'Verify before exam')),
        h('p', { class: 'fact' }, c.statement),
        reveal, why),
    );
  };
  next();
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

// Unit quiz and past-paper practice: answer, see why, move on.
async function quiz(arg) {
  show(h('p', { class: 'meta' }, 'Loading questions…'));
  const unitNo = arg === 'pp' ? null : +arg;
  const unit = unitNo ? state.modules.find((m) => m.module_no === unitNo) : null;
  if (arg !== 'pp' && !unit) { location.hash = '#/'; return; }
  let qs;
  try {
    const pattern = PREFIX + (arg === 'pp' ? 'pp-' : `u${unitNo}`) + '%';
    const ids = (await all(() => sb.from('questions').select('id').like('id', pattern).order('id'))).map((r) => r.id);
    qs = await loadQuestions(shuffle(ids).slice(0, UNIT_QUIZ_SIZE));
  } catch (e) { return show(errorBox('Could not load questions: ' + e.message)); }

  const started = new Date().toISOString();
  const title = unit ? `Unit ${unit.module_no} quiz` : 'Past-paper questions';
  let i = 0, correct = 0, wrong = 0;
  const answers = {};

  const next = async () => {
    if (i >= qs.length) {
      // kind is 'unit' or 'mock' (table check); past papers are a unit row with no module.
      await saveAttempt('unit', unit?.id ?? null, qs.length, correct, wrong, correct, answers, started);
      return show(h('h1', {}, title + ': done'), h('p', { class: 'big' }, `${correct} / ${qs.length}`),
        h('div', { class: 'row' }, h('a', { class: 'btn', href: `study#/quiz/${arg}`, onclick: () => setTimeout(route, 0) }, 'Another set'),
          h('a', { class: 'btn ghost', href: 'study#/' }, 'Back to my course')));
    }
    const q = qs[i];
    const right = answerOf(q);
    const why = h('div', { class: 'why', hidden: true });
    const nextBtn = h('button', { class: 'btn next', hidden: true, onclick: () => { i += 1; next(); } }, i + 1 < qs.length ? 'Next question' : 'See my score');
    const opts = options(q).map(([k, text]) => h('button', { class: 'o', onclick: async () => {
      opts.forEach((b) => { b.disabled = true; });
      answers[q.id] = k;
      if (k === right) correct += 1; else { wrong += 1; opts[k.charCodeAt(0) - 97].classList.add('bad'); }
      opts[right.charCodeAt(0) - 97]?.classList.add('good');
      nextBtn.hidden = false;
      const facts = await linkedFacts(q.id);
      if (facts.length) { why.hidden = false; why.replaceChildren(h('strong', {}, 'Facts behind this question'), h('ul', { class: 'linked' }, facts.map((f) => h('li', {}, f)))); }
    } }, `${k.toUpperCase()}. ${text}`));
    show(
      h('div', { class: 'row' }, h('a', { href: 'study#/' }, '← My course'), h('span', { class: 'small', style: 'margin-left:auto' }, `${title} · ${i + 1} of ${qs.length}`)),
      h('div', { class: 'quiz', style: 'max-width:none' },
        q.paper_code ? h('p', { class: 'src' }, q.paper_code) : null,
        h('p', { class: 'q' }, q.stem), opts, why, nextBtn),
    );
  };
  next();
}

// Mock test: exam conditions, no feedback until the end.
async function mock() {
  show(
    h('h1', {}, 'Mock test'),
    h('div', { class: 'panel' },
      h('p', {}, `${MOCK.count} questions from all five units. ${MOCK.minutes} minutes. +1 for a right answer, −⅓ for a wrong one, 0 if you leave it blank.`),
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
        h('a', { class: 'btn', href: 'study#/' }, 'Back to my course')),
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
  const name = (r) => r.kind === 'mock' ? 'Mock test' : !r.module_id ? 'Past papers'
    : 'Unit ' + (state.modules.find((m) => m.id === r.module_id)?.module_no ?? '');
  show(
    h('div', { class: 'row' }, h('a', { href: 'study#/' }, '← My course')),
    h('h1', {}, 'My scores'),
    data.length ? h('table', { class: 'res' },
      h('tr', {}, h('th', {}, 'When'), h('th', {}, 'Test'), h('th', {}, 'Score'), h('th', {}, 'Right / wrong')),
      data.map((r) => h('tr', {},
        h('td', {}, r.finished_at ? new Date(r.finished_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''),
        h('td', {}, name(r)), h('td', {}, `${r.score} / ${r.total}`), h('td', {}, `${r.correct} / ${r.wrong}`))))
      : h('p', {}, 'No tests yet. Try a unit quiz or a mock test.'),
  );
}

// ---------- invoices ----------
// Issued by the payment webhook (geological_assistant.issue_invoice); this page
// only shows them. "Save as PDF" is the browser's print dialog.
async function invoices() {
  const { data, error } = await sb.from('invoices').select('id,doc_type,invoice_no,issued_at,total_minor')
    .order('issued_at', { ascending: false });
  if (error) return show(errorBox('Could not load your invoices: ' + error.message));
  show(
    h('div', { class: 'row' }, h('a', { href: 'study#/' }, '← My course')),
    h('h1', {}, 'My invoices'),
    data.length ? h('table', { class: 'res' },
      h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Number'), h('th', {}, 'Amount'), h('th', {}, '')),
      data.map((r) => h('tr', {},
        h('td', {}, dateIN(r.issued_at)),
        h('td', {}, r.invoice_no, r.doc_type === 'credit_note' ? ' (credit note)' : ''),
        h('td', {}, (r.doc_type === 'credit_note' ? '−' : '') + rupees2(r.total_minor)),
        h('td', {}, h('a', { href: 'study#/invoice/' + r.id }, 'View / download')))))
      : h('p', {}, 'No invoices yet. Your invoice appears here a few seconds after your payment is confirmed.'),
  );
}

async function invoice(id) {
  const { data: d, error } = await sb.from('invoices').select('*').eq('id', id).maybeSingle();
  if (error || !d) return show(errorBox('Invoice not found.'));
  const credit = d.doc_type === 'credit_note';
  const taxed = !!d.seller_gstin;
  const title = credit ? 'Credit Note' : taxed ? 'Tax Invoice' : 'Receipt';
  const pct = (bp) => (bp / 100).toString() + '%';
  const original = credit && d.original_invoice_id
    ? (await sb.from('invoices').select('invoice_no,issued_at').eq('id', d.original_invoice_id).maybeSingle()).data
    : null;
  const taxRows = !taxed ? [] : d.igst_minor > 0
    ? [['IGST @ ' + pct(d.gst_rate_bp), d.igst_minor]]
    : [['CGST @ ' + pct(d.gst_rate_bp / 2), d.cgst_minor], ['SGST @ ' + pct(d.gst_rate_bp / 2), d.sgst_minor]];
  const kv = (k, v) => v ? h('div', {}, h('span', { class: 'k' }, k), ' ', v) : null;

  show(
    h('div', { class: 'row noprint' },
      h('a', { href: 'study#/invoices' }, '← My invoices'),
      h('button', { class: 'btn sm', onclick: () => window.print() }, 'Download PDF / Print')),
    h('article', { class: 'invoice' },
      h('header', {},
        h('div', {}, h('h1', {}, title),
          kv(credit ? 'Credit note no.' : taxed ? 'Invoice no.' : 'Receipt no.', d.invoice_no),
          kv('Date', dateIN(d.issued_at)),
          original && kv('Against invoice', original.invoice_no + ' dated ' + dateIN(original.issued_at))),
        h('div', { class: 'seller' }, h('strong', {}, d.seller_name), h('div', {}, d.seller_address),
          kv('GSTIN', d.seller_gstin), kv('State', stateName(d.seller_state_code) + ' (' + d.seller_state_code + ')'))),
      h('section', { class: 'parties' },
        h('div', {}, h('div', { class: 'k' }, 'Billed to'),
          h('strong', {}, d.buyer_name || d.buyer_email || 'Customer'),
          d.buyer_name && d.buyer_email ? h('div', {}, d.buyer_email) : null,
          kv('GSTIN', d.buyer_gstin)),
        h('div', {},
          kv('Place of supply', stateName(d.place_of_supply) + ' (' + d.place_of_supply + ')'),
          taxed ? kv('Reverse charge', 'No') : null,
          kv('Payment ref.', d.provider_payment_id))),
      h('table', { class: 'lines' },
        h('tr', {}, h('th', {}, 'Description'), h('th', {}, 'SAC'), h('th', {}, 'Qty'), h('th', { class: 'r' }, taxed ? 'Taxable value' : 'Amount')),
        h('tr', {}, h('td', {}, d.description), h('td', {}, d.sac), h('td', {}, '1'), h('td', { class: 'r' }, rupees2(d.taxable_minor))),
        taxRows.map(([k, v]) => h('tr', { class: 'sum' }, h('td', { colspan: 3 }, k), h('td', { class: 'r' }, rupees2(v)))),
        h('tr', { class: 'sum total' }, h('td', { colspan: 3 }, credit ? 'Total credited' : 'Total paid'),
          h('td', { class: 'r' }, rupees2(d.total_minor)))),
      h('p', { class: 'small' }, 'Amount in words: ' + inWords(d.total_minor)),
      !taxed ? h('p', { class: 'small' }, 'The seller is not registered under GST, so no GST is charged.') : null,
      h('p', { class: 'small' }, 'This is a computer-generated ' + title.toLowerCase() +
        ' and needs no signature. Questions: info@calecutech.com')),
  );
}

function dateIN(t) { return new Date(t).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }); }
function rupees2(minor) { return '₹' + (minor / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function stateName(code) { return STATES.find(([c]) => c === code)?.[1] ?? code; }

// "Rupees Three Thousand Only", in the Indian system (lakh, crore).
function inWords(minor) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (n) => n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  const three = (n) => [n >= 100 ? ones[Math.floor(n / 100)] + ' Hundred' : '', two(n % 100)].filter(Boolean).join(' ');
  const words = (n) => {
    if (!n) return 'Zero';
    const parts = [];
    for (const [size, name] of [[1e7, 'Crore'], [1e5, 'Lakh'], [1e3, 'Thousand']]) {
      if (n >= size) { parts.push(words(Math.floor(n / size)) + ' ' + name); n %= size; }
    }
    if (n) parts.push(three(n));
    return parts.join(' ');
  };
  const r = Math.floor(minor / 100), p = minor % 100;
  return 'Rupees ' + words(r) + (p ? ' and ' + two(p) + ' Paise' : '') + ' Only';
}

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
// GST state codes.
const STATES = [
  ['35', 'Andaman and Nicobar Islands'], ['37', 'Andhra Pradesh'], ['12', 'Arunachal Pradesh'], ['18', 'Assam'],
  ['10', 'Bihar'], ['04', 'Chandigarh'], ['22', 'Chhattisgarh'], ['26', 'Dadra and Nagar Haveli and Daman and Diu'],
  ['07', 'Delhi'], ['30', 'Goa'], ['24', 'Gujarat'], ['06', 'Haryana'], ['02', 'Himachal Pradesh'],
  ['01', 'Jammu and Kashmir'], ['20', 'Jharkhand'], ['29', 'Karnataka'], ['32', 'Kerala'], ['38', 'Ladakh'],
  ['31', 'Lakshadweep'], ['23', 'Madhya Pradesh'], ['27', 'Maharashtra'], ['14', 'Manipur'], ['17', 'Meghalaya'],
  ['15', 'Mizoram'], ['13', 'Nagaland'], ['21', 'Odisha'], ['34', 'Puducherry'], ['03', 'Punjab'], ['08', 'Rajasthan'],
  ['11', 'Sikkim'], ['33', 'Tamil Nadu'], ['36', 'Telangana'], ['16', 'Tripura'], ['09', 'Uttar Pradesh'],
  ['05', 'Uttarakhand'], ['19', 'West Bengal'],
];

boot().catch((e) => show(errorBox('Something went wrong: ' + e.message)));
