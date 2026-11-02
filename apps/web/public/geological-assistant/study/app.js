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
// Tests run on the same exam rules: +1 right, −¼ wrong. The placement test is on day 2,
// the weekly test on day 7 and every 7 days after. Both give a score for each unit.
const TESTS = {
  placement: { kind: 'placement', route: 'placement', label: 'Placement test', count: 50, minutes: 60 },
  weekly: { kind: 'weekly', route: 'weekly', label: 'Weekly test', count: 50, minutes: 60 },
};
const FULL_MOCK = { kind: 'mock', label: 'Mock test', count: MOCK.count, minutes: MOCK.minutes };
const HOME = location.origin + '/geological-assistant/study';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: 'geological_assistant' },
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
});

const app = document.getElementById('app');

// A coupon in the link (?coupon=CODE) is kept through the Google sign-in round trip.
const COUPON_KEY = 'ga-coupon';
try {
  const c = new URLSearchParams(location.search).get('coupon');
  if (c) sessionStorage.setItem(COUPON_KEY, c.trim().toUpperCase());
} catch { /* storage blocked */ }
function savedCoupon() { try { return sessionStorage.getItem(COUPON_KEY) || ''; } catch { return ''; } }
function saveCoupon(c) { try { if (c) sessionStorage.setItem(COUPON_KEY, c); else sessionStorage.removeItem(COUPON_KEY); } catch { /* storage blocked */ } }
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
  document.getElementById('progresstab').hidden = !state.user;
  // The Admin tab shows only for admins (the server checks again on every admin call).
  if (state.user) sb.rpc('is_admin').then(({ data }) => { document.getElementById('admintab').hidden = data !== true; });
  if (state.user) sb.rpc('my_referral', { p_course_id: COURSE }).then(({ data }) => { document.getElementById('referstab').hidden = data?.enabled !== true; }, () => {});
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
  if (page === 'admin') return admin();
  // An admin looking at one learner: #/progress/<user id>.
  if (page === 'progress' && arg) return progress(arg);
  if (!state.paid) return buy();
  // There is no unit or mode picker: old #/study/<unit> and #/quiz/<unit> links land on today's plan.
  if (page === 'today') return today();
  if (page === 'mock') return mock();
  if (page === 'placement') return testIntro(TESTS.placement);
  if (page === 'weekly') return testIntro(TESTS.weekly);
  if (page === 'results') return results();
  if (page === 'referrals') return referrals();
  if (page === 'progress') return progress();
  if (page === 'schedule') return progress().then(() => document.getElementById('schedule')?.scrollIntoView());
  return home();
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
  const list = state.course?.price_minor ?? 300000;
  let quote = { code: null, percent_off: 0, price_minor: list };
  const msg = h('div');
  const button = h('button', { class: 'btn', onclick: pay });
  const priceBox = h('p', { class: 'big' });
  const codeInput = h('input', { class: 'code', id: 'coupon', placeholder: 'Coupon code', autocomplete: 'off', maxlength: 32 });
  const codeMsg = h('p', { class: 'small', 'aria-live': 'polite' });

  function render() {
    const off = quote.percent_off;
    priceBox.replaceChildren(...[
      off ? h('s', { class: 'was' }, rupees(list)) : null, off ? ' ' : null,
      quote.price_minor ? rupees(quote.price_minor) : 'Free',
      h('span', { class: 'small' }, off ? `  ${off}% off with ${quote.code}` : '  one-time, lifetime access')].filter((x) => x != null));
    button.textContent = quote.price_minor ? 'Pay ' + rupees(quote.price_minor) + ' by UPI, card or netbanking' : 'Unlock the course';
  }

  async function apply(code, quiet) {
    code = (code || '').trim().toUpperCase();
    codeMsg.className = 'small';
    if (!code) { quote = { code: null, percent_off: 0, price_minor: list }; saveCoupon(''); codeMsg.textContent = ''; return render(); }
    const { data, error } = await sb.rpc('quote_price', { p_course_id: COURSE, p_code: code });
    const q = Array.isArray(data) ? data[0] : data;
    if (error || !q) {
      if (!quiet) { codeMsg.className = 'err'; codeMsg.textContent = error?.message || 'This code is not valid'; }
      return false;
    }
    // Keep the bigger discount if two codes are tried.
    if (q.percent_off < quote.percent_off && quiet) return false;
    quote = q;
    codeInput.value = q.code;
    saveCoupon(q.code);
    codeMsg.className = 'okmsg';
    codeMsg.textContent = `${q.code} applied: ${q.percent_off}% off.` + (q.expires_at ? ` Valid till ${new Date(q.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.` : '');
    render();
    return true;
  }

  async function pay() {
    button.disabled = true;
    msg.replaceChildren();
    if (quote.code && quote.price_minor === 0) return claim();
    try {
      await loadRazorpay();
      const { data, error } = await sb.functions.invoke('ga-razorpay-create-order', { body: { courseId: COURSE, couponCode: quote.code || undefined } });
      if (error || !data?.orderId) {
        let detail = data?.error;
        try { detail = detail || (await error?.context?.json())?.error; } catch { /* not JSON */ }
        throw new Error(detail || 'Could not start the payment. Please try again.');
      }
      new window.Razorpay({
        key: data.keyId, order_id: data.orderId, amount: data.amount, currency: data.currency,
        name: 'Geological Assistant Prep', description: 'Lifetime access' + (data.coupon ? ` (${data.coupon})` : ''),
        prefill: { email: state.user.email, name: state.user.user_metadata?.full_name || '' },
        theme: { color: '#b4531f' },
        handler: () => { saveCoupon(''); waitForUnlock(msg); },
        modal: { ondismiss: () => { button.disabled = false; } },
      }).open();
    } catch (e) {
      msg.replaceChildren(errorBox(e.message));
      button.disabled = false;
    }
  }

  // A free-access code from the admin: no payment, the course unlocks at once.
  async function claim() {
    const { error } = await sb.rpc('claim_access_code', { p_code: quote.code });
    if (error) { msg.replaceChildren(errorBox(error.message)); button.disabled = false; return; }
    saveCoupon('');
    state.paid = true;
    location.hash = '#/';
    route();
  }

  render();
  show(
    h('h1', {}, 'Unlock the full course'),
    h('p', { class: 'small' }, 'Signed in as ' + (state.user.email || '')),
    spinPanel((code) => apply(code, true)),
    h('div', { class: 'panel' },
      priceBox,
      h('ul', {},
        h('li', {}, '1,854 fact cards with the reason behind each fact'),
        h('li', {}, '1,212 practice questions, unit quizzes and timed mock tests'),
        h('li', {}, 'Spaced revision: each fact comes back just before you forget it'),
        h('li', {}, 'Web and Android app on the same account')),
      h('form', { class: 'row coupon', onsubmit: (e) => { e.preventDefault(); apply(codeInput.value); } },
        h('label', { for: 'coupon', class: 'small' }, 'Have a code?'), codeInput,
        h('button', { class: 'btn ghost sm', type: 'submit' }, 'Apply')),
      codeMsg,
      button, msg,
      h('p', { class: 'small' }, 'Paid through Razorpay. Your card and UPI details go to Razorpay, never to us. ',
        h('a', { href: 'refunds/' }, 'Refund Policy'), '.')),
    h('div', { class: 'panel' }, h('h2', {}, 'What is inside'),
      h('div', { class: 'units' }, state.modules.map((m) =>
        h('div', { class: 'unit' }, h('span', { class: 'n' }, 'UNIT ' + m.module_no), h('h3', {}, m.name))))),
    adminLink(),
  );
  if (savedCoupon()) apply(savedCoupon());
  // The admin made a free-access code for this account: fill it in.
  sb.from('coupons').select('code,used_count,max_uses').eq('kind', 'access').eq('course_id', COURSE).eq('active', true)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
    .then(({ data }) => { if (data && data.used_count < (data.max_uses ?? 1)) apply(data.code); });
}

// ---------- spin the wheel: one spin per account, 10% to 30% off ----------
// The server picks the prize (spin_wheel in 0004_coupons.sql); the wheel only
// shows it. The code works for this account only, once, for 7 days.
const WHEEL = [10, 15, 20, 25, 30, 10, 15, 20];
function wheelSvg() {
  const n = WHEEL.length, r = 100, colors = ['#b4531f', '#2f6b4f', '#8a5a00', '#1f2a33'];
  const slice = (i) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const x0 = r + r * Math.cos(a0), y0 = r + r * Math.sin(a0), x1 = r + r * Math.cos(a1), y1 = r + r * Math.sin(a1);
    const am = (a0 + a1) / 2, tx = r + 0.64 * r * Math.cos(am), ty = r + 0.64 * r * Math.sin(am);
    return `<path d="M${r},${r} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" fill="${colors[i % 4]}"/>`
      + `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" fill="#fff" font-family="system-ui,sans-serif" font-size="17" font-weight="800" text-anchor="middle" dominant-baseline="middle" transform="rotate(${(((i + 0.5) / n) * 360).toFixed(1)} ${tx.toFixed(2)} ${ty.toFixed(2)})">${WHEEL[i]}%</text>`;
  };
  const wrap = document.createElement('div');
  wrap.className = 'wheel';
  // Built from constants only, never from data.
  wrap.innerHTML = `<svg viewBox="0 0 200 200" role="img" aria-label="Discount wheel: 10% to 30% off"><g class="spin">${WHEEL.map((_, i) => slice(i)).join('')}</g><circle cx="100" cy="100" r="16" fill="#fffdf8" stroke="#1f2a33" stroke-width="3"/></svg><span class="pointer" aria-hidden="true"></span>`;
  return wrap;
}

function spinPanel(onCode) {
  const panel = h('div', { class: 'panel spinbox' });
  const result = h('p', { class: 'okmsg', 'aria-live': 'polite' });
  const wheel = wheelSvg();
  const btn = h('button', { class: 'btn', onclick: spin }, 'Spin the wheel');
  const done = (c, fresh) => {
    const left = Math.max(0, Math.ceil((Date.parse(c.expires_at) - Date.now()) / 86400000));
    result.textContent = (fresh ? `You won ${c.percent_off}% off! ` : `Your prize: ${c.percent_off}% off. `)
      + `Code ${c.code}, applied below. ${left ? `Use it within ${left} day${left === 1 ? '' : 's'}.` : ''}`;
    btn.remove();
    onCode(c.code);
  };
  const landOn = (pct) => {
    const idx = [...WHEEL.keys()].filter((i) => WHEEL[i] === pct);
    const i = idx[Math.floor(Math.random() * idx.length)] ?? 0;
    return 360 * 6 - ((i + 0.5) / WHEEL.length) * 360;
  };
  async function spin() {
    btn.disabled = true;
    result.className = 'okmsg';
    result.textContent = '';
    const { data, error } = await sb.rpc('spin_wheel', { p_course_id: COURSE });
    const c = Array.isArray(data) ? data[0] : data;
    if (error || !c) { result.className = 'err'; result.textContent = error?.message || 'Could not spin. Please try again.'; btn.disabled = false; return; }
    const g = wheel.querySelector('.spin');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    g.style.transition = reduce ? 'none' : 'transform 4s cubic-bezier(.17,.67,.2,1)';
    g.style.transform = `rotate(${landOn(c.percent_off)}deg)`;
    setTimeout(() => done(c, !c.already_spun), reduce ? 0 : 4100);
  }
  panel.append(h('h2', {}, 'Spin for a discount'),
    h('p', { class: 'small' }, 'One free spin per account. Win 10% to 30% off the course.'),
    wheel, btn, result);
  // Already spun on another visit: show the prize instead of the button.
  sb.from('coupons').select('code,percent_off,expires_at,used_count,max_uses').eq('kind', 'spin').eq('course_id', COURSE).maybeSingle()
    .then(({ data }) => {
      if (!data) return;
      const g = wheel.querySelector('.spin');
      g.style.transform = `rotate(${landOn(data.percent_off)}deg)`;
      if (Date.parse(data.expires_at) <= Date.now() || data.used_count >= (data.max_uses ?? 1)) {
        btn.remove();
        result.className = 'small';
        result.textContent = `You already used your spin (${data.percent_off}% off, code ${data.code}), and that code has expired.`;
      } else done(data, false);
    });
  return panel;
}

// ---------- referrals: a paid learner refers friends and earns a commission ----------
// Shown only to learners the admin picked. Everything is checked again on the server.
// The Refer tab in the top menu is shown only to learners the admin picked (see the session start).

async function referrals() {
  const back = h('div', { class: 'row' }, h('a', { href: 'study#/' }, '← Today'));
  show(h('p', { class: 'meta' }, 'Loading…'));
  const { data, error } = await sb.rpc('my_referral', { p_course_id: COURSE });
  if (error) return show(back, errorBox('Could not load referrals: ' + error.message));
  if (!data.enabled) return show(back, h('h1', {}, 'Refer friends'), h('p', {}, 'Referrals are not open on your account.'));
  const msg = h('p', { class: 'small', 'aria-live': 'polite' });
  if (!data.code) {
    const make = h('button', { class: 'btn', onclick: async () => {
      make.disabled = true;
      const { error: e } = await sb.rpc('create_my_referral_code', { p_course_id: COURSE });
      if (e) { msg.className = 'err'; msg.textContent = e.message; make.disabled = false; return; }
      referrals();
    } }, 'Create my referral code');
    return show(back, h('h1', {}, 'Refer friends'),
      h('div', { class: 'panel' },
        h('p', {}, `Your friends get ${data.percent_off}% off the course with your code. You earn ${data.commission_percent}% of what they pay.`),
        data.paid ? make : h('p', { class: 'small' }, 'Buy the course first, then you can create your code.'),
        msg));
  }
  const link = `https://calecutech.com/geological-assistant/study?coupon=${data.code}`;
  const copy = h('button', { class: 'btn ghost sm', onclick: async () => {
    try { await navigator.clipboard.writeText(link); copy.textContent = 'Copied'; } catch { copy.textContent = 'Copy failed'; }
  } }, 'Copy link');
  const date = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const tile = (big, label) => h('div', { class: 'tile' }, h('span', { class: 'big' }, big), h('span', { class: 'small' }, label));
  const sales = data.sales.length
    ? h('div', { class: 'scroll' }, h('table', { class: 'res' },
        h('tr', {}, h('th', {}, 'Date'), h('th', {}, 'Buyer'), h('th', {}, 'Paid'), h('th', {}, 'Your share')),
        data.sales.map((s) => h('tr', {}, h('td', {}, date(s.created_at)), h('td', {}, s.buyer), h('td', {}, rupees(s.paid_minor)), h('td', {}, rupees(s.commission_minor))))))
    : h('p', { class: 'small' }, 'No purchases with your code yet.');
  show(
    back,
    h('h1', {}, 'Refer friends'),
    h('p', { class: 'small' }, 'Shown only to learners the admin has picked to refer.'),
    h('div', { class: 'panel' }, h('h2', {}, 'Your code'),
      h('p', {}, h('strong', { class: 'big' }, data.code), ' ', copy),
      h('p', { class: 'small' }, `${link}`),
      h('p', { class: 'small' }, `Friends get ${data.percent_off}% off.${data.max_uses ? ` The code works for ${data.max_uses} purchases.` : ''} You earn ${data.commission_percent}% of what they pay.`)),
    h('div', { class: 'tiles' },
      tile(rupees(Number(data.earned_minor)), 'Earned so far'),
      tile(String(data.sales.length), 'Purchases'),
      tile(String(data.used_count), 'Uses')),
    h('div', { class: 'panel' }, h('h2', {}, 'Purchases with your code'), sales),
    msg);
}

// Admin: which learners can refer, their discount and use limit, and what they have earned.
function referralAdmin() {
  const msg = h('p', { class: 'small', 'aria-live': 'polite' });
  const body = h('div');
  const cap = h('input', { type: 'number', min: 1, max: 50, required: true, value: 20 });
  const comm = h('input', { type: 'number', min: 1, max: 50, required: true, value: 10 });
  const field = (label, el) => h('label', { class: 'field' }, h('span', { class: 'small' }, label), el);
  const ref = { cap: () => Number(cap.value) || 20 };
  async function load() {
    const [s, p] = await Promise.all([
      sb.rpc('admin_get_referral_settings', { p_course_id: COURSE }),
      sb.rpc('admin_list_referral_partners', { p_course_id: COURSE }),
    ]);
    const err = s.error || p.error;
    if (err) { body.replaceChildren(errorBox(err.message)); return; }
    cap.value = s.data.max_discount_percent;
    comm.value = s.data.commission_percent;
    if (!p.data.length) { body.replaceChildren(h('p', { class: 'small' }, 'No referrers yet. Use "Make referrer" in the participants list.')); return; }
    const rows = p.data.map((r) => {
      const pct = h('input', { type: 'number', min: 1, max: s.data.max_discount_percent, value: r.percent_off, style: 'width:5em' });
      const uses = h('input', { type: 'number', min: 1, placeholder: 'No limit', value: r.max_uses ?? '', style: 'width:6em' });
      // Read the discount and limit when clicked, so an edit is saved with the button.
      const act = (enabled, label) => h('button', { class: 'btn ghost sm', onclick: async () => {
        const { error } = await sb.rpc('admin_set_referral_partner', { p_course_id: COURSE, p_user_id: r.user_id,
          p_enabled: enabled, p_percent: Number(pct.value), p_max_uses: uses.value ? Number(uses.value) : null });
        if (error) { msg.className = 'err'; msg.textContent = error.message; return; }
        msg.className = 'okmsg'; msg.textContent = 'Saved.';
        load();
      } }, label);
      return h('tr', { class: r.enabled ? '' : 'off' },
        h('td', {}, r.email || '(no email)', r.code ? h('div', { class: 'small' }, r.code) : null),
        h('td', {}, pct, '%'),
        h('td', {}, uses),
        h('td', {}, `${r.used_count} used · ${r.sales_count} paid`),
        h('td', {}, rupees(Number(r.earned_minor))),
        h('td', {},
          act(true, 'Save'), ' ',
          act(!r.enabled, r.enabled ? 'Turn off' : 'Turn on')));
    });
    body.replaceChildren(h('div', { class: 'scroll' }, h('table', { class: 'res' },
      h('tr', {}, h('th', {}, 'Referrer'), h('th', {}, 'Discount'), h('th', {}, 'Use limit'), h('th', {}, 'Uses'), h('th', {}, 'Earned'), h('th', {}, '')),
      rows)));
  }
  const saveSettings = h('button', { class: 'btn', type: 'button', onclick: async () => {
    const { error } = await sb.rpc('admin_set_referral_settings', { p_course_id: COURSE, p_max_discount: Number(cap.value), p_commission: Number(comm.value) });
    if (error) { msg.className = 'err'; msg.textContent = error.message; return; }
    msg.className = 'okmsg'; msg.textContent = 'Settings saved.';
    load();
  } }, 'Save settings');
  ref.el = h('div', { class: 'panel' },
    h('h2', {}, 'Referrals'),
    h('p', { class: 'small' }, 'Only the learners you pick can refer. A referrer makes their code once they have paid. Buyers get the discount; the referrer earns the commission on what the buyer pays.'),
    h('div', { class: 'grid' },
      field('Biggest discount a referrer can give (%)', cap),
      field('Commission to referrer (%)', comm),
      saveSettings),
    msg, body);
  ref.reload = load;
  load();
  return ref;
}

// ---------- admin: coupons ----------
function adminLink() {
  const box = h('p', { class: 'small', hidden: true }, h('a', { href: 'study#/admin' }, 'Admin: participants and coupons'));
  sb.rpc('is_admin').then(({ data }) => { if (data === true) box.hidden = false; });
  return box;
}

async function admin() {
  show(h('p', { class: 'meta' }, 'Loading…'));
  const { data: ok } = await sb.rpc('is_admin');
  if (ok !== true) return show(h('h1', {}, 'Admins only'), h('p', {}, h('a', { href: 'study#/' }, '← Back')));
  const f = {
    code: h('input', { id: 'c-code', required: true, maxlength: 32, placeholder: 'PSC50', pattern: '[A-Za-z0-9\\-]{3,32}' }),
    pct: h('input', { id: 'c-pct', type: 'number', min: 1, max: 99, required: true, placeholder: '50' }),
    max: h('input', { id: 'c-max', type: 'number', min: 1, placeholder: 'No limit' }),
    exp: h('input', { id: 'c-exp', type: 'date' }),
    note: h('input', { id: 'c-note', maxlength: 120, placeholder: 'Who it is for' }),
  };
  const msg = h('p', { class: 'small', 'aria-live': 'polite' });
  const table = h('div');
  const people = h('div');
  const peopleMsg = h('p', { class: 'small', 'aria-live': 'polite' });
  const field = (id, label, el) => h('label', { class: 'field', for: id }, h('span', { class: 'small' }, label), el);
  const save = async (args) => {
    const { error } = await sb.rpc('admin_save_coupon', { p_course_id: COURSE, ...args });
    if (error) { msg.className = 'err'; msg.textContent = error.message; return false; }
    msg.className = 'okmsg'; msg.textContent = `Saved ${args.p_code.toUpperCase()}.`;
    await load();
    return true;
  };
  async function load() {
    const { data, error } = await sb.rpc('admin_list_coupons', { p_course_id: COURSE });
    if (error) { table.replaceChildren(errorBox(error.message)); return; }
    const price = state.course?.price_minor ?? 300000;
    const date = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const rows = data.map((c) => h('tr', { class: c.active ? '' : 'off' },
      h('td', {}, h('strong', {}, c.code), c.note ? h('div', { class: 'small' }, c.note) : null),
      h('td', {}, c.kind === 'spin' ? 'Spin' : c.kind === 'access' ? 'Free access' : 'Admin'),
      h('td', {}, `${c.percent_off}%`, h('div', { class: 'small' }, c.kind === 'access' ? 'Free' : rupees(Math.max(100, Math.round(price * (100 - c.percent_off) / 100))))),
      h('td', {}, `${c.used_count}${c.max_uses ? ' / ' + c.max_uses : ''}`),
      h('td', {}, date(c.expires_at)),
      h('td', {}, c.kind === 'admin'
        ? h('button', { class: 'btn ghost sm', onclick: () => save({ p_code: c.code, p_percent_off: c.percent_off, p_max_uses: c.max_uses, p_expires_at: c.expires_at, p_note: c.note, p_active: !c.active }) }, c.active ? 'Turn off' : 'Turn on')
        : (c.active ? 'On' : 'Off'))));
    const n = (k) => data.filter((c) => c.kind === k).length;
    table.replaceChildren(
      h('p', { class: 'small' }, `${n('admin')} admin codes · ${n('spin')} spins · ${n('access')} free-access codes · ${data.reduce((t, c) => t + c.used_count, 0)} uses`),
      h('div', { class: 'scroll' }, h('table', { class: 'res' },
        h('tr', {}, h('th', {}, 'Code'), h('th', {}, 'Type'), h('th', {}, 'Off'), h('th', {}, 'Used'), h('th', {}, 'Expires'), h('th', {}, '')),
        rows)));
  }
  const ref = referralAdmin();
  show(
    h('div', { class: 'row' }, h('a', { href: 'study#/' }, '← Back')),
    h('h1', {}, 'Admin'),
    h('p', { class: 'small' }, 'You can open the full course free as admin. ', h('a', { href: 'study#/' }, 'Go to the course')),
    h('div', { class: 'panel' }, h('h2', {}, 'Participants'),
      h('p', { class: 'small' }, 'Everyone who signed in on the course page. "Free code" makes a one-use code for that person only; when they sign in, the buy page fills it in and the course unlocks without payment.'),
      peopleMsg, people),
    h('div', { class: 'panel' },
      h('h2', {}, 'Make a coupon'),
      h('p', { class: 'small' }, 'Saving an existing code changes it. Spin-wheel codes are made by the wheel and cannot be edited here.'),
      h('form', { class: 'grid', onsubmit: async (e) => {
        e.preventDefault();
        const ok = await save({
          p_code: f.code.value.trim(), p_percent_off: Number(f.pct.value), p_max_uses: f.max.value ? Number(f.max.value) : null,
          p_expires_at: f.exp.value ? new Date(f.exp.value + 'T23:59:59+05:30').toISOString() : null, p_note: f.note.value || null, p_active: true,
        });
        if (ok) e.target.reset();
      } },
        field('c-code', 'Code', f.code), field('c-pct', 'Discount %', f.pct), field('c-max', 'Max uses', f.max),
        field('c-exp', 'Last day', f.exp), field('c-note', 'Note', f.note),
        h('button', { class: 'btn', type: 'submit' }, 'Save coupon')),
      msg,
      h('p', { class: 'small' }, 'Share link: calecutech.com/geological-assistant/study?coupon=CODE')),
    ref.el,
    h('div', { class: 'panel' }, h('h2', {}, 'All coupons'), table),
  );
  load();
  loadPeople();

  async function loadPeople() {
    const { data, error } = await sb.rpc('admin_list_participants', { p_course_id: COURSE });
    if (error) { people.replaceChildren(errorBox(error.message)); return; }
    const date = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
    const access = (p) => !p.has_access ? 'No'
      : p.paid_via === 'coupon' ? 'Free code'
      : p.paid_via === 'razorpay' ? 'Paid ' + rupees(p.amount_minor ?? 0)
      : p.paid_via === 'google_play' ? 'Paid (Play)' : 'Yes';
    const makeCode = async (p, btn) => {
      btn.disabled = true;
      const { data: code, error: e } = await sb.rpc('admin_make_access_code', { p_course_id: COURSE, p_user_id: p.user_id, p_note: p.email });
      if (e) { peopleMsg.className = 'err'; peopleMsg.textContent = e.message; btn.disabled = false; return; }
      peopleMsg.className = 'okmsg';
      peopleMsg.textContent = `Code ${code} made for ${p.email}. They sign in with that Google account and the course unlocks. Link: calecutech.com/geological-assistant/study?coupon=${code}`;
      loadPeople();
      load();
    };
    const makeReferrer = async (p, btn) => {
      btn.disabled = true;
      const { error: e } = await sb.rpc('admin_set_referral_partner', { p_course_id: COURSE, p_user_id: p.user_id,
        p_enabled: true, p_percent: Math.min(10, ref.cap()), p_max_uses: null });
      if (e) { peopleMsg.className = 'err'; peopleMsg.textContent = e.message; btn.disabled = false; return; }
      peopleMsg.className = 'okmsg';
      peopleMsg.textContent = `${p.email} can now refer. They create their code once they have paid. Set the discount and limit in Referrals.`;
      ref.reload();
    };
    const rows = data.map((p) => {
      let act = '';
      if (!p.has_access) {
        act = p.access_code ? h('strong', {}, p.access_code) : h('button', { class: 'btn ghost sm' }, 'Free code');
        if (act.tagName === 'BUTTON') act.addEventListener('click', () => makeCode(p, act));
      }
      return h('tr', {},
        h('td', {}, p.email || '(no email)', h('div', { class: 'small' }, 'Joined ' + date(p.signed_up_at))),
        h('td', {}, access(p), p.paid_at ? h('div', { class: 'small' }, date(p.paid_at)) : null),
        h('td', {}, String(p.cards_studied)),
        h('td', {}, String(p.tests_taken)),
        h('td', {}, date(p.last_studied_at)),
        h('td', {}, h('a', { class: 'btn ghost sm', href: 'study#/progress/' + p.user_id }, 'Progress'), ' ', act, ' ',
          h('button', { class: 'btn ghost sm', onclick: (e) => makeReferrer(p, e.currentTarget) }, 'Make referrer')));
    });
    const paid = data.filter((p) => p.has_access && p.paid_via !== 'coupon').length;
    const free = data.filter((p) => p.paid_via === 'coupon').length;
    people.replaceChildren(
      h('p', { class: 'small' }, `${data.length} signed in · ${paid} paid · ${free} free code · ${data.length - paid - free} no access`),
      h('div', { class: 'scroll' }, h('table', { class: 'res' },
        h('tr', {}, h('th', {}, 'Person'), h('th', {}, 'Access'), h('th', {}, 'Cards'), h('th', {}, 'Tests'), h('th', {}, 'Last study'), h('th', {}, '')),
        rows)));
  }
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
    all(() => sb.from('user_card_state').select('card_id,ease,interval_days,reps,lapses,due_at,last_reviewed_at').order('card_id')),
    sb.from('quiz_attempts').select('kind,answers,finished_at').eq('course_id', COURSE).gte('started_at', since)
      .order('started_at').limit(300).then(({ data, error }) => { if (error) throw error; return data; }),
  ]);
  const testRows = await sb.from('quiz_attempts').select('kind,finished_at').eq('course_id', COURSE)
    .in('kind', ['placement', 'weekly']).order('finished_at', { ascending: false }).limit(100)
    .then(({ data, error }) => { if (error) throw error; return data; });
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
  const { placementDue, weeklyDue } = testsDue(testRows);

  return {
    placementDue, weeklyDue,
    lastStudied: seen.reduce((m, s) => Math.max(m, s.last_reviewed_at ? Date.parse(s.last_reviewed_at) : 0), 0),
    cards, stateById, due, fresh, daysLeft, final, mockDue, mockToday, progress, lastAnswer, log,
    learned: cards.length - unseen.length,
    pastPaper: { total: pastPaper.length, learned: pastPaper.filter((c) => stateById.has(c.id)).length },
    practiceSize: final ? PRACTICE.final : PRACTICE.learn,
  };
}

// Optional tests. The placement test is due from day 2; the weekly test from day 7,
// then once in each week. Rows are the learner's test attempts, newest first.
// They are never part of Today: they sit on the Progress page as an option.
function testsDue(rows) {
  const startDay = state.user?.created_at ? new Date(state.user.created_at) : today0();
  startDay.setHours(0, 0, 0, 0);
  const daysIn = daysBetween(startDay, today0());
  const lastWeekly = rows.find((r) => r.kind === 'weekly' && r.finished_at);
  const weekStart = startDay.getTime() + Math.floor(daysIn / 7) * 7 * DAY;
  return {
    placementDue: daysIn >= 1 && !rows.some((r) => r.kind === 'placement'),
    weeklyDue: daysIn >= 7 && (!lastWeekly || Date.parse(lastWeekly.finished_at) < weekStart),
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

  // A gentle nudge when days were missed: say how many, and that the plan has adjusted.
  const lastDay = new Date(plan.lastStudied); lastDay.setHours(0, 0, 0, 0);
  const missed = plan.lastStudied ? daysBetween(lastDay, today0()) - 1 : 0;
  const nudge = missed >= 1 && !log.done ? h('div', { class: 'panel nudge' },
    h('strong', {}, missed === 1 ? 'You missed yesterday.' : `You have not studied for ${missed} days.`),
    ' ', `No problem. Today starts with the ${due.length ? due.length + ' facts you are about to forget' : 'revisions'}, and the rest of the plan is spread over the days left.`) : null;


  // The placement test (from day 2) and the weekly test (from day 7) are shown on Today until taken.
  const testToday = plan.placementDue ? TESTS.placement : plan.weeklyDue ? TESTS.weekly : null;
  const testPanel = testToday ? h('div', { class: 'panel' },
    h('h2', {}, testToday.label),
    h('p', {}, `${testToday.count} questions across all units. It shows which units are hard for you.`),
    h('a', { class: 'btn ghost', href: 'study#/' + testToday.route }, 'Take the test')) : null;

  show(
    h('h1', {}, 'Today'),
    h('p', { class: 'lead' }, when),
    nudge,
    todayPanel,
    testPanel,
    h('div', { class: 'panel' },
      h('h2', {}, 'Your progress'),
      h('p', {}, h('span', { class: 'big' }, plan.learned), ` of ${plan.cards.length} facts learned  ·  `,
        h('span', { class: 'big' }, plan.pastPaper.learned), ` of ${plan.pastPaper.total} past-paper facts`),
      h('div', { class: 'units' }, plan.progress.map(({ m, total, seen: s }) =>
        h('div', { class: 'unit' },
          h('span', { class: 'n' }, `UNIT ${m.module_no} · ${s}/${total}`),
          h('h3', {}, m.name),
          h('div', { class: 'bar-out' }, h('div', { class: 'bar-in', style: `width:${total ? Math.round((100 * s) / total) : 0}%` })))))),
    h('p', { class: 'small' }, h('a', { href: 'study#/progress' }, 'My progress'), '  ·  ', h('a', { href: 'study#/schedule' }, 'My schedule'), '  ·  ', h('a', { href: 'study#/results' }, 'My scores'), '  ·  ',
      h('a', { href: '#', onclick: (e) => { e.preventDefault(); askExamDate(); } }, 'Change exam date'),
      '  ·  Signed in as ' + (state.user.email || '')),
    adminLink(),
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

async function saveAttempt(kind, moduleId, total, correct, wrong, score, answers, started, unitScores = null) {
  await sb.from('quiz_attempts').insert({
    user_id: state.user.id, course_id: COURSE, kind, module_id: moduleId,
    total, correct, wrong, score, answers, started_at: started, finished_at: new Date().toISOString(),
    unit_scores: unitScores,
  });
}

// Mock test: exam conditions, no feedback until the end.
async function mock() {
  show(
    h('h1', {}, 'Mock test'),
    h('div', { class: 'panel' },
      h('p', {}, `${MOCK.count} questions from all five units. ${MOCK.minutes} minutes. +1 for a right answer, −¼ for a wrong one, 0 if you leave it blank.`),
      h('p', { class: 'small' }, 'The test submits itself when time runs out. Do not close this tab.'),
      h('button', { class: 'btn', onclick: () => runTest(FULL_MOCK) }, 'Start now')),
  );
}

function testIntro(t) {
  show(
    h('h1', {}, t.label),
    h('div', { class: 'panel' },
      h('p', {}, `${t.count} questions from all five units, ${t.count / 5} from each. ${t.minutes} minutes. +1 for a right answer, −¼ for a wrong one, 0 if you leave it blank.`),
      h('p', { class: 'small' }, 'It shows where you are strong and where you are weak. Your score for each unit is saved.'),
      h('p', { class: 'small' }, 'The test submits itself when time runs out. Do not close this tab.'),
      h('button', { class: 'btn', onclick: () => runTest(t) }, 'Start now')),
  );
}

// Units with their score for one test, weakest first.
function unitRows(unitScores) {
  return Object.entries(unitScores || {})
    .map(([n, r]) => ({ n: +n, right: r.right, total: r.total, pct: r.total ? r.right / r.total : 0 }))
    .sort((a, b) => a.pct - b.pct || a.n - b.n);
}
function weakAreasPanel(unitScores, title) {
  const rows = unitRows(unitScores);
  if (!rows.length) return null;
  const weak = rows.filter((r) => r.pct < 0.5).map((r) => `Unit ${r.n}`);
  return h('div', { class: 'panel' },
    h('h2', {}, title || 'Your units'),
    h('p', {}, weak.length ? `Hard for you right now: ${weak.join(', ')}.` : 'No unit is below half right.'),
    h('table', { class: 'res' },
      h('tr', {}, h('th', {}, 'Unit'), h('th', {}, 'Right'), h('th', {}, '%')),
      rows.map((r) => h('tr', {}, h('td', {}, `Unit ${r.n}`), h('td', {}, `${r.right} / ${r.total}`), h('td', {}, `${Math.round(r.pct * 100)}%`)))));
}

async function runTest(t) {
  show(h('p', { class: 'meta' }, 'Setting your paper…'));
  let qs;
  try {
    const ids = (await all(() => sb.from('questions').select('id').eq('course_id', COURSE).order('id'))).map((r) => r.id);
    // Roughly 20 per unit, like the paper's 20 marks per unit.
    const byUnit = {};
    for (const id of shuffle(ids)) (byUnit[unitOfQuestion(id) ?? 0] ||= []).push(id);
    let pick = [];
    for (let u = 1; u <= 5; u++) pick.push(...(byUnit[u] || []).slice(0, t.count / 5));
    if (pick.length < t.count) pick.push(...shuffle(ids.filter((x) => !pick.includes(x))).slice(0, t.count - pick.length));
    qs = await loadQuestions(shuffle(pick));
  } catch (e) { return show(errorBox('Could not set the paper: ' + e.message)); }

  const started = new Date();
  const ends = started.getTime() + t.minutes * 60000;
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
    const unitScores = {};
    for (const q of qs) {
      const u = unitOfQuestion(q.id) ?? 0;
      unitScores[u] ||= { right: 0, total: 0 };
      unitScores[u].total += 1;
      if (picks[q.id] && picks[q.id] === answerOf(q)) unitScores[u].right += 1;
    }
    await saveAttempt(t.kind, null, qs.length, correct, wrong, score, clean, started.toISOString(), unitScores);
    const wrongOnes = qs.filter((q) => picks[q.id] && picks[q.id] !== answerOf(q));
    show(
      h('h1', {}, t.label + ' result'),
      h('div', { class: 'panel' },
        h('p', { class: 'big' }, `${score} / ${qs.length}`),
        h('p', {}, `${correct} right, ${wrong} wrong, ${qs.length - correct - wrong} left blank.`),
        h('a', { class: 'btn', href: 'study#/' }, 'Back to today')),
      t.kind === 'mock' ? null : weakAreasPanel(unitScores, 'Your units on this test'),
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
  const name = (r) => r.kind === 'mock' ? 'Mock test' : r.kind === 'placement' ? 'Placement test' : r.kind === 'weekly' ? 'Weekly test' : !r.module_id ? 'Practice'
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

// ---------- progress board ----------
// What a learner has learned, unit by unit, and how their tests went. With a
// user id (admins only) it shows that learner instead; the server checks
// admin rights in admin_user_progress.
const STRONG_DAYS = 21; // a fact whose next revision is 3+ weeks away is counted as strong

async function progress(userId) {
  show(h('p', { class: 'meta' }, 'Loading progress…'));
  let states, attempts, who = null;
  try {
    const cardsQ = all(() => sb.from('cards').select('id,module_id,source_ref').eq('course_id', COURSE).order('id'));
    if (userId) {
      const { data, error } = await sb.rpc('admin_user_progress', { p_course_id: COURSE, p_user_id: userId });
      if (error) throw error;
      ({ states, attempts } = data);
      who = data.email || 'this learner';
    } else {
      [states, attempts] = await Promise.all([
        all(() => sb.from('user_card_state').select('card_id,interval_days,reps,lapses,due_at,last_reviewed_at').order('card_id')),
        sb.from('quiz_attempts').select('kind,module_id,total,correct,wrong,score,finished_at,unit_scores').eq('course_id', COURSE)
          .order('finished_at', { ascending: false }).limit(200).then(({ data, error }) => { if (error) throw error; return data; }),
      ]);
    }
    renderProgress(await cardsQ, states || [], attempts || [], who, userId);
  } catch (e) {
    show(h('div', { class: 'row' }, h('a', { href: userId ? 'study#/admin' : 'study#/' }, '← Back')), errorBox('Could not load progress: ' + e.message));
  }
}

// The newest placement or weekly test's unit scores, for the progress board.
function latestUnits(done) {
  const t = done.find((a) => (a.kind === 'weekly' || a.kind === 'placement') && a.unit_scores);
  return t ? t.unit_scores : null;
}

function renderProgress(cards, states, attempts, who, userId) {
  const now = Date.now();
  const byId = new Map(states.map((s) => [s.card_id, s]));
  const strong = (s) => s && s.interval_days >= STRONG_DAYS;
  const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
  const learned = cards.filter((c) => byId.has(c.id));
  const strongN = cards.filter((c) => strong(byId.get(c.id))).length;
  const dueN = states.filter((s) => Date.parse(s.due_at) <= now).length;
  const pp = cards.filter((c) => c.source_ref);
  const ppLearned = pp.filter((c) => byId.has(c.id)).length;
  const shaky = states.filter((s) => s.lapses >= 2).length;

  // Days with study in the last 14 days (from each fact's latest revision).
  const studied = new Set(states.filter((s) => s.last_reviewed_at).map((s) => dayKey(new Date(s.last_reviewed_at))));
  attempts.filter((a) => a.finished_at).forEach((a) => studied.add(dayKey(new Date(a.finished_at))));
  // Every day since the start, not just the last two weeks: from the learner's sign-up
  // (or their first study day, if that is earlier) to today. Admins see the learner's own start.
  let first = today0();
  if (!userId && state.user?.created_at) { first = new Date(state.user.created_at); first.setHours(0, 0, 0, 0); }
  for (const k of studied) { const d = parseDay(k); if (d < first) first = d; }
  const days = [];
  const span = Math.min(730, daysBetween(first, today0()));
  for (let i = span; i >= 0; i--) { const d = new Date(today0().getTime() - i * DAY); days.push({ d, on: studied.has(dayKey(d)) }); }
  const studyDays = days.filter((x) => x.on).length;
  // Pad the first week so each day sits under its weekday (Monday first).
  const lead = (first.getDay() + 6) % 7;
  const lastSeen = states.reduce((m, s) => Math.max(m, s.last_reviewed_at ? Date.parse(s.last_reviewed_at) : 0), 0);

  const done = attempts.filter((a) => a.finished_at);
  const mocks = done.filter((a) => a.kind === 'mock');
  const avg = (xs) => xs.length ? Math.round(xs.reduce((t, a) => t + (100 * a.correct) / Math.max(1, a.total), 0) / xs.length) : null;
  const best = mocks.length ? Math.max(...mocks.map((a) => Number(a.score))) : null;
  const date = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const name = (r) => r.kind === 'mock' ? 'Mock test' : r.kind === 'placement' ? 'Placement test' : r.kind === 'weekly' ? 'Weekly test' : !r.module_id ? 'Practice'
    : 'Unit ' + (state.modules.find((m) => m.id === r.module_id)?.module_no ?? '');
  const tile = (big, label) => h('div', { class: 'tile' }, h('span', { class: 'big' }, big), h('span', { class: 'small' }, label));
  // Own progress only: an optional test, offered here and never on Today.
  const due = userId ? null : testsDue(attempts);
  const t = due?.placementDue ? TESTS.placement : due?.weeklyDue ? TESTS.weekly : null;
  const optionalTest = t ? h('div', { class: 'panel' },
    h('h2', {}, `${t.label} (optional)`),
    h('p', {}, t.kind === 'placement'
      ? `${t.count} questions across all units. It shows which units are hard for you. Your plan does not wait for it.`
      : `${t.count} questions across all units. It shows how your learning is going, unit by unit. Your plan does not wait for it.`),
    h('a', { class: 'btn ghost', href: 'study#/' + t.route }, 'Take the test')) : null;

  show(
    h('div', { class: 'row' }, h('a', { href: userId ? 'study#/admin' : 'study#/' }, userId ? '← Admin' : '← Today')),
    h('h1', {}, who ? 'Progress: ' + who : 'My progress'),
    h('p', { class: 'lead' }, lastSeen ? `Last studied ${date(lastSeen)}.` : 'No study yet.'),
    optionalTest,
    h('div', { class: 'tiles' },
      tile(`${pct(learned.length, cards.length)}%`, `${learned.length} of ${cards.length} facts learned`),
      tile(String(strongN), `strong facts (next revision ${STRONG_DAYS}+ days away)`),
      tile(`${ppLearned}/${pp.length}`, 'past-paper facts learned'),
      tile(String(dueN), 'facts due for revision now')),
    h('div', { class: 'panel' },
      h('h2', {}, 'Units'),
      h('div', { class: 'scroll' }, h('table', { class: 'res' },
        h('tr', {}, h('th', {}, 'Unit'), h('th', {}, 'Learned'), h('th', {}, 'Strong'), h('th', {}, '')),
        state.modules.map((m) => {
          const mine = cards.filter((c) => c.module_id === m.id);
          const l = mine.filter((c) => byId.has(c.id)).length, st = mine.filter((c) => strong(byId.get(c.id))).length;
          return h('tr', {},
            h('td', {}, h('strong', {}, `Unit ${m.module_no}`), h('div', { class: 'small' }, m.name)),
            h('td', {}, `${l} / ${mine.length}`), h('td', {}, String(st)),
            h('td', { class: 'barcell' }, h('div', { class: 'bar-out' }, h('div', { class: 'bar-in', style: `width:${pct(l, mine.length)}%` }))));
        }))),
      shaky ? h('p', { class: 'small' }, `${shaky} fact${shaky === 1 ? '' : 's'} forgotten twice or more. They come back more often.`) : null),
    h('div', { class: 'panel' },
      h('h2', {}, 'Study calendar'),
      h('p', { class: 'small' }, `${studyDays} study day${studyDays === 1 ? '' : 's'} since ${date(first)}. Scroll up for older days.`),
      h('div', { class: 'calendar', id: 'calendar' },
        h('div', { class: 'days days-head' }, ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x) => h('span', { class: 'small' }, x))),
        h('div', { class: 'days' },
          Array.from({ length: lead }, () => h('span', { class: 'day pad' })),
          days.map(({ d, on }) => h('span', { class: on ? 'day on' : 'day', title: date(d) + (on ? ': studied' : ': no study') }, String(d.getDate())))))),
    h('div', { class: 'panel' },
      h('h2', {}, 'Tests'),
      weakAreasPanel(latestUnits(done), 'Units on your latest test'),
      done.length ? h('p', {}, `${done.length} done · average ${avg(done)}% right` + (mocks.length ? ` · ${mocks.length} mock test${mocks.length === 1 ? '' : 's'}, best ${best} / ${MOCK.count}` : '')) : h('p', {}, 'No tests yet.'),
      done.length ? h('div', { class: 'scroll' }, h('table', { class: 'res' },
        h('tr', {}, h('th', {}, 'When'), h('th', {}, 'Test'), h('th', {}, 'Score'), h('th', {}, 'Right / wrong')),
        done.slice(0, 15).map((r) => h('tr', {},
          h('td', {}, date(r.finished_at)), h('td', {}, name(r)), h('td', {}, `${r.score} / ${r.total}`), h('td', {}, `${r.correct} / ${r.wrong}`))))) : null),
  );
  const cal = document.getElementById('calendar');
  if (cal) cal.scrollTop = cal.scrollHeight; // start at today; scroll up for older days

}

// ---------- study schedule ----------
// The plan from today to the exam, week by week. It plays the daily plan
// forward: the same new-facts-a-day pace, past-paper facts first, the least
// covered unit next, no new facts in the final week, and mock tests weekly
// once 40% is learned (every third day in the last three weeks).
function buildSchedule(cards, byId, attempts) {
  const p = prefs();
  const exam = p.exam && p.exam !== 'unknown' ? parseDay(p.exam) : null;
  const start = today0();
  const daysLeft = exam ? Math.max(0, daysBetween(start, exam)) : null;
  const units = state.modules.map((m) => {
    const mine = cards.filter((c) => c.module_id === m.id);
    const left = mine.filter((c) => !byId.has(c.id));
    return { m, total: mine.length, seen: mine.length - left.length, pp: left.filter((c) => c.source_ref).length, rest: left.filter((c) => !c.source_ref).length };
  });
  let unseen = units.reduce((t, u) => t + u.pp + u.rest, 0);
  let learned = cards.length - unseen;
  const span = daysLeft != null ? daysLeft : Math.min(56, Math.ceil(unseen / NEW_PER_DAY) + 7);
  const mocks = attempts.filter((a) => a.kind === 'mock' && a.finished_at).map((a) => Date.parse(a.finished_at));
  let lastMock = mocks.length ? Math.max(...mocks) : null;
  const weeks = [];
  for (let i = 0; i < span; i++) {
    const day = new Date(start.getTime() + i * DAY);
    const left = daysLeft != null ? daysLeft - i : null;
    const final = left != null && left <= FINAL_DAYS;
    const closing = left != null && left <= 21;
    if (i % 7 === 0) weeks.push({ from: day, to: day, fresh: 0, units: new Map(), mocks: 0, final });
    const w = weeks[weeks.length - 1];
    w.to = day;
    w.final = w.final && final;
    if (final && !w.finalFrom) w.finalFrom = day;
    const mockDue = (learned / cards.length >= 0.4 || closing) && (lastMock == null || day.getTime() - lastMock >= (closing ? 3 : 7) * DAY);
    if (mockDue) { w.mocks += 1; lastMock = day.getTime(); }
    if (final || !unseen) continue;
    let perDay = left != null ? Math.ceil(unseen / Math.max(1, left - FINAL_DAYS)) : NEW_PER_DAY;
    perDay = Math.round(Math.min(60, Math.max(10, perDay)) * (p.pace || 1));
    if (mockDue) perDay = Math.ceil(perDay / 2);
    for (let k = 0; k < perDay && unseen; k++) {
      const open = units.filter((u) => u.pp + u.rest);
      const pp = open.filter((u) => u.pp);
      const u = (pp.length ? pp : open).reduce((x, y) => (x.seen / x.total <= y.seen / y.total ? x : y));
      if (u.pp) u.pp -= 1; else u.rest -= 1;
      u.seen += 1; unseen -= 1; learned += 1; w.fresh += 1;
      w.units.set(u.m.module_no, (w.units.get(u.m.module_no) || 0) + 1);
    }
  }
  const perDayNow = weeks[0] ? Math.round(weeks[0].fresh / Math.min(7, span)) : 0;
  return { exam, daysLeft, weeks, perDayNow };
}

function schedulePanel(cards, byId, attempts) {
  const { exam, daysLeft, weeks, perDayNow } = buildSchedule(cards, byId, attempts);
  const date = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const change = h('a', { href: '#', onclick: (e) => { e.preventDefault(); askExamDate(); } }, 'Change exam date');
  if (daysLeft === 0) return h('div', { class: 'panel' }, h('h2', {}, 'Your schedule'), h('p', {}, 'Your exam is today. Good luck!'));
  // About half a minute per new fact, plus revision and quick questions.
  const minutes = Math.max(20, Math.round((perDayNow + 10) / 5) * 5);
  return h('div', { class: 'panel', id: 'schedule' },
    h('h2', {}, 'Your schedule'),
    h('p', {}, exam
      ? `Exam on ${date(exam)}, ${daysLeft} day${daysLeft === 1 ? '' : 's'} away. Study every day: about ${perDayNow} new facts plus revision, roughly ${minutes} minutes.`
      : `No exam date yet, so this assumes ${NEW_PER_DAY} new facts a day. Study every day, roughly ${minutes} minutes.`),
    h('div', { class: 'scroll' }, h('table', { class: 'res sched' },
      h('tr', {}, h('th', {}, 'Week'), h('th', {}, 'Learn'), h('th', {}, 'Mock tests')),
      weeks.map((w, i) => h('tr', { class: i === 0 ? 'now' : null },
        h('td', {}, h('strong', {}, i === 0 ? 'This week' : `Week ${i + 1}`), h('div', { class: 'small' }, `${date(w.from)} – ${date(w.to)}`)),
        h('td', {}, w.final ? 'Final week: revision only'
          : w.fresh ? h('span', {}, `${w.fresh} new facts`, h('div', { class: 'small' },
            [...w.units.entries()].sort((a, b) => b[1] - a[1]).map(([n, c]) => `Unit ${n}: ${c}`).join(' · ')),
            w.finalFrom ? h('div', { class: 'small' }, `Revision only from ${date(w.finalFrom)}`) : null)
          : 'Revision and practice'),
        h('td', {}, w.mocks ? String(w.mocks) : '–'))))),
    h('p', { class: 'small' }, 'Revision of what you have learned comes every day on top of this. Miss a day and the plan spreads the rest over the days left. ', change));
}

boot().catch((e) => show(errorBox('Something went wrong: ' + e.message)));
