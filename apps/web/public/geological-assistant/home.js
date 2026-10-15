// Geological Assistant Prep: the course home page.
// Join buttons, the sample fact cards, the exam planner and the sample quiz.
(function () {
  var C = window.GEO_CONFIG || { salesOpen: false };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- join course ----------
  // Joining happens in the web course: Google sign-in, then the Razorpay
  // checkout (ga-razorpay-create-order), then the webhook unlocks the account.
  var joinUrl = (C.consoleUrl || 'study') + '?course=' + encodeURIComponent(C.courseId || '');
  document.querySelectorAll('[data-buy]').forEach(function (a) {
    if (C.salesOpen) {
      a.href = joinUrl;
      if (a.dataset.label) a.textContent = a.dataset.label;
    } else {
      a.href = 'mailto:info@calecutech.com?subject=' + encodeURIComponent('Notify me: Geological Assistant Prep');
      a.textContent = 'Notify me at launch';
    }
  });
  var note = document.getElementById('buy-note');
  if (note && !C.salesOpen) note.textContent = 'Opening very soon at ₹3,000 one-time. Email us and we will tell you the day it opens.';

  // ---------- reveal on scroll, count-up numbers, sticky bar ----------
  var nf = new Intl.NumberFormat('en-IN');
  function countUp(el) {
    var end = +el.dataset.count, t0 = null;
    if (reduce) return;
    function tick(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1200);
      el.textContent = nf.format(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        e.target.querySelectorAll('[data-count]').forEach(countUp);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.s .wrap, .ribbon .wrap').forEach(function (el) { el.classList.add('rv'); io.observe(el); });

    var sticky = document.getElementById('sticky'), hero = document.querySelector('.hero'), price = document.getElementById('pricing');
    var seen = { hero: true, price: false };
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target === hero ? 'hero' : 'price'] = e.isIntersecting; });
      sticky.classList.toggle('on', !seen.hero && !seen.price);
    });
    so.observe(hero); so.observe(price);
  }

  // The past-papers strip scrolls forever: a second copy follows the first.
  var strip = document.querySelector('.marquee ul');
  if (strip) strip.innerHTML += strip.innerHTML.replace(/<li>/g, '<li aria-hidden="true">');

  // ---------- sample fact cards ----------
  var cards = [
    { u: 'Unit 5 · Hydrogeology', q: 'Which packing of equal spheres gives the lowest porosity?',
      a: 'Rhombohedral packing, about 26%. Cubic packing gives the highest, about 47.6%.',
      w: 'Why: each sphere nests into the hollows of the layer below, leaving less empty space.' },
    { u: 'Unit 2 · Palaeontology', q: 'Which plant fossil is the signature of the Gondwana flora?',
      a: 'Glossopteris, the seed fern found across India, Africa, South America, Antarctica and Australia.',
      w: 'Why it matters: the same flora on now-separate continents is classic evidence for Gondwanaland.' },
    { u: 'Unit 5 · Hydrogeology', q: 'Write Darcy’s law for flow through an aquifer.',
      a: 'Q = K · i · A: discharge equals hydraulic conductivity × hydraulic gradient × cross-sectional area.',
      w: 'Why: flow through porous media is laminar, so discharge rises in direct proportion to the gradient.' }
  ];
  var ci = 0, flip = document.getElementById('flip');
  function $(id) { return document.getElementById(id); }
  function showCard() {
    var c = cards[ci];
    flip.classList.remove('flipped');
    $('fc-unit').textContent = c.u; $('fc-unit2').textContent = c.u;
    $('fc-q').textContent = c.q; $('fc-a').textContent = c.a; $('fc-why').textContent = c.w;
    $('pfoot').textContent = 'Card ' + (ci + 1) + ' of ' + cards.length + ' · sample';
    $('rate').classList.remove('on');
  }
  flip.addEventListener('click', function () {
    flip.classList.toggle('flipped');
    $('rate').classList.toggle('on', flip.classList.contains('flipped'));
  });
  var next = { again: 'Again: you will see this card again today.', good: 'Good: back in a few days.', easy: 'Easy: back in a couple of weeks.' };
  $('rate').addEventListener('click', function (e) {
    var r = e.target.dataset && e.target.dataset.r; if (!r) return;
    $('pfoot').textContent = next[r];
    setTimeout(function () { ci = (ci + 1) % cards.length; showCard(); }, 900);
  });
  showCard();

  // Highlight the day's steps in turn.
  var steps = document.querySelectorAll('.steps li'), si = 0;
  steps.forEach(function (li, k) { li.addEventListener('mouseenter', function () { si = k; mark(); }); });
  function mark() { steps.forEach(function (li, k) { li.classList.toggle('on', k === si); }); }
  if (!reduce) setInterval(function () { si = (si + 1) % steps.length; mark(); }, 3200);

  // ---------- exam planner ----------
  var TOTAL = 1854, FINAL = 7, weeks = $('weeks');
  function plan() {
    var w = +weeks.value, days = w * 7 - FINAL, per = Math.ceil(TOTAL / days), finish = Math.ceil(TOTAL / per);
    $('wk').textContent = w; $('perday').textContent = per; $('finish').textContent = finish;
    $('pnote').textContent = per > 20
      ? 'A sprint. The plan focuses on past-paper facts first, so the most-asked topics are covered early.'
      : per > 12 ? 'A steady pace. About 20 to 30 minutes a day, with unit quizzes on weekends.'
      : 'A calm pace. Lots of time for extra quizzes and repeated mock tests.';
    weeks.style.setProperty('--p', ((w - weeks.min) / (weeks.max - weeks.min) * 100) + '%');
  }
  weeks.addEventListener('input', plan); plan();

  // ---------- sample quiz ----------
  var Q = [
    { s: 'Kerala PSC Junior Hydrogeologist 2023', q: 'The SI-based unit commonly used for transmissivity is:', o: ['m/day', 'per metre (1/m)', 'm²/day', 'm³/day'], x: 2, e: 'Transmissivity = hydraulic conductivity (m/day) × thickness (m) = m²/day. m/day belongs to hydraulic conductivity, and 1/m to specific storage.' },
    { s: 'Kerala PSC HSST Geology 2026', q: 'In the Udden-Wentworth scale, the boundary between sand and silt lies at:', o: ['0.25 mm', '2 mm', '0.0625 mm', '0.002 mm'], x: 2, e: 'Sand runs from 2 mm down to 1/16 mm (0.0625 mm). 2 mm is the sand-gravel boundary. The silt-clay boundary is near 0.004 mm.' },
    { s: 'GATE 2026 Geomatics', q: 'An aerial photograph in which the horizon is visible is called a:', o: ['low oblique photograph', 'orthophotograph', 'vertical photograph', 'high oblique photograph'], x: 3, e: 'High oblique photos are tilted so much that the horizon appears. A low oblique is tilted but does not show the horizon.' }
  ];
  var i = 0, right = 0, box = $('quiz'), score = $('score');
  function render() {
    var d = Q[i];
    box.innerHTML = '<div class="src"><span>' + d.s + '</span><span>' + (i + 1) + ' / ' + Q.length + '</span></div><div class="q"></div>';
    box.querySelector('.q').textContent = d.q;
    var w = document.createElement('div'), nx = document.createElement('button');
    d.o.forEach(function (t, k) {
      var b = document.createElement('button'); b.className = 'o'; b.type = 'button';
      b.innerHTML = '<i>' + String.fromCharCode(65 + k) + '</i>'; b.appendChild(document.createTextNode(t));
      b.onclick = function () {
        box.querySelectorAll('button.o').forEach(function (x, j) { x.disabled = true; if (j === d.x) x.classList.add('good'); });
        if (k !== d.x) b.classList.add('bad'); else right++;
        w.textContent = (k === d.x ? 'Correct. ' : 'Not quite. ') + d.e; w.classList.add('on'); nx.hidden = false;
        if (i === Q.length - 1) score.textContent = 'You scored ' + right + ' of ' + Q.length + '. The full course has 1,209 more.';
      };
      box.appendChild(b);
    });
    w.className = 'why'; box.appendChild(w);
    nx.className = 'btn ghost next'; nx.type = 'button'; nx.hidden = true; nx.textContent = i < Q.length - 1 ? 'Next question' : 'Start again';
    nx.onclick = function () { i = (i + 1) % Q.length; if (i === 0) { right = 0; score.textContent = ''; } render(); };
    box.appendChild(nx);
  }
  render();
})();
