/**
 * Design system for QuizKerala's site (/quizkerala/*).
 *
 * Self-contained like lib/goldlelam/styles.ts: the route has its own root
 * layout, so it cannot lean on the (site) Tailwind build. Palette is Kerala
 * green with kasavu gold, matching the app icon and store art in the
 * quizkerala repo's branding/ folder.
 *
 * The mobile menu is a <details> element, so it opens and closes with no
 * client JavaScript.
 */
export const QUIZKERALA_STYLES = String.raw`
:root {
  --font-display: "Trebuchet MS", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;

  --bg: #f6fbf7;
  --bg-raised: #ffffff;
  --panel: #e7f4ec;

  --ink: #0f2a1d;
  --ink-muted: #3d5a4b;
  --ink-faint: #6b8577;

  --green: #0f8a4f;
  --green-deep: #0a5c35;
  --gold: #e3a92b;
  --gold-light: #f8e2a8;

  --hairline: rgba(15, 42, 29, 0.12);
  --hairline-soft: rgba(15, 42, 29, 0.07);
  --stop: #b3261e;
  --stop-bg: rgba(179, 38, 30, 0.07);

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;
  --shadow-soft: 0 12px 32px rgba(10, 92, 53, 0.14);
}

* { box-sizing: border-box; }
html { color-scheme: light; scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--green-deep); text-decoration: none; }
a:hover { text-decoration: underline; }
h1, h2, h3 { font-family: var(--font-display); line-height: 1.2; margin: 0; color: var(--ink); }
img { max-width: 100%; height: auto; }

.wrap { max-width: 68rem; margin: 0 auto; padding: 0 1rem; }
@media (min-width: 40rem) { .wrap { padding: 0 1.5rem; } }

.skip-link { position: absolute; left: -999px; top: 0; background: var(--ink); color: #fff; padding: 0.5rem 1rem; z-index: 50; }
.skip-link:focus { left: 0.5rem; top: 0.5rem; }

/* ---------------------------------------------------------------- masthead */

.masthead {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(1.4) blur(8px);
  border-bottom: 1px solid var(--hairline-soft);
}
.masthead .wrap { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 64px; }

.brand { display: flex; align-items: center; gap: 0.6rem; font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; color: var(--ink); }
.brand:hover { text-decoration: none; }
.brand img { width: 36px; height: 36px; border-radius: 10px; }
.brand .accent { color: var(--green); }

.nav-desktop { display: none; gap: 0.25rem; align-items: center; }
.nav-desktop a {
  min-height: 44px; display: inline-flex; align-items: center; padding: 0 0.75rem;
  border-radius: 999px; color: var(--ink-muted); font-size: 0.93rem;
}
.nav-desktop a:hover { background: var(--panel); color: var(--green-deep); text-decoration: none; }
.nav-desktop a[aria-current="page"] { color: var(--green-deep); font-weight: 600; background: var(--panel); }
.nav-desktop .btn { margin-left: 0.5rem; }
.nav-desktop a.btn-primary, .nav-desktop a.btn-primary:hover { color: #fff; background: linear-gradient(135deg, var(--green), var(--green-deep)); }

.nav-mobile { position: relative; }
.nav-mobile summary {
  list-style: none; cursor: pointer; min-height: 44px; min-width: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--hairline); border-radius: 12px; font-size: 1.3rem; color: var(--ink);
}
.nav-mobile summary::-webkit-details-marker { display: none; }
.nav-mobile[open] summary { background: var(--panel); }
.nav-mobile .menu {
  position: absolute; right: 0; top: calc(100% + 0.5rem); width: min(18rem, calc(100vw - 2rem));
  background: var(--bg-raised); border: 1px solid var(--hairline); border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft); padding: 0.5rem; display: grid;
}
.nav-mobile .menu a { min-height: 44px; display: flex; align-items: center; padding: 0 0.85rem; border-radius: 10px; color: var(--ink); }
.nav-mobile .menu a:hover, .nav-mobile .menu a[aria-current="page"] { background: var(--panel); text-decoration: none; }
.nav-mobile .menu .btn { margin-top: 0.4rem; justify-content: center; color: #fff; }

@media (min-width: 60rem) {
  .nav-desktop { display: flex; }
  .nav-mobile { display: none; }
}

/* ----------------------------------------------------------------- buttons */

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  min-height: 44px; padding: 0 1.3rem; border-radius: 999px;
  font-size: 0.95rem; font-weight: 600; border: 0; cursor: pointer;
}
.btn:hover { text-decoration: none; }
.btn-primary { background: linear-gradient(135deg, var(--green), var(--green-deep)); color: #fff; box-shadow: var(--shadow-soft); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-gold { background: var(--gold); color: var(--ink); }
.btn-gold:hover { filter: brightness(1.05); }
.btn-secondary { background: var(--bg-raised); color: var(--ink); border: 1px solid var(--hairline); }
.btn-secondary:hover { border-color: var(--green); }
.btn-danger { background: var(--stop); color: #fff; }

/* -------------------------------------------------------------------- hero */

.hero {
  padding: 3.5rem 0 3rem;
  background:
    radial-gradient(55% 60% at 85% 10%, rgba(227, 169, 43, 0.22) 0%, transparent 70%),
    radial-gradient(60% 60% at 10% 0%, var(--panel) 0%, transparent 70%),
    var(--bg);
}
.hero .wrap { display: grid; gap: 2.5rem; align-items: center; }
@media (min-width: 56rem) { .hero .wrap { grid-template-columns: 1.15fr 0.85fr; } }
.eyebrow {
  display: inline-block; font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--green-deep); background: var(--gold-light); padding: 0.3rem 0.75rem; border-radius: 999px; margin-bottom: 1rem;
}
.hero h1 { font-size: clamp(2.1rem, 6vw, 3.4rem); }
.hero h1 .accent { color: var(--green); }
.lede { margin: 1.1rem 0 0; color: var(--ink-muted); font-size: 1.1rem; max-width: 34rem; }
.hero-actions { display: flex; gap: 0.75rem; margin-top: 1.8rem; flex-wrap: wrap; }

.join-box {
  margin-top: 1.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap; max-width: 26rem;
}
.join-box input {
  flex: 1 1 10rem; min-height: 44px; border-radius: 999px; border: 1px solid var(--hairline);
  padding: 0 1rem; font-size: 1rem; letter-spacing: 0.12em; text-transform: uppercase; background: #fff;
}
.join-box input:focus { outline: 2px solid var(--green); outline-offset: 1px; }

.phone {
  margin: 0 auto; width: min(18rem, 80vw); aspect-ratio: 9 / 18.5; border-radius: 2.2rem;
  background: var(--ink); padding: 0.7rem; box-shadow: 0 30px 60px rgba(15, 42, 29, 0.25);
}
.phone-screen {
  height: 100%; border-radius: 1.7rem; background: var(--bg-raised); overflow: hidden;
  display: flex; flex-direction: column; font-size: 0.8rem;
}
.phone-top { background: linear-gradient(135deg, var(--green), var(--green-deep)); color: #fff; padding: 1rem; }
.phone-top .timer { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; color: var(--gold-light); }
.phone-body { padding: 1rem; display: grid; gap: 0.5rem; }
.phone-q { font-weight: 600; color: var(--ink); margin-bottom: 0.3rem; }
.phone-opt { border: 1px solid var(--hairline); border-radius: 10px; padding: 0.55rem 0.7rem; color: var(--ink-muted); }
.phone-foot { margin-top: auto; padding: 1rem; display: grid; gap: 0.6rem; }
.phone-bar { height: 6px; border-radius: 999px; background: var(--panel); overflow: hidden; }
.phone-bar span { display: block; height: 100%; width: 40%; background: var(--gold); }
.phone-next { text-align: center; border-radius: 999px; padding: 0.6rem; background: var(--green); color: #fff; font-weight: 600; }
.phone-opt.picked { border-color: var(--green); background: var(--panel); color: var(--green-deep); font-weight: 600; }

/* ---------------------------------------------------------------- sections */

section.block { padding: 3.5rem 0; }
section.block.alt { background: var(--panel); }
.section-heading { text-align: center; margin: 0 auto 2.25rem; max-width: 40rem; }
.section-heading h2 { font-size: clamp(1.6rem, 3.5vw, 2.2rem); }
.section-heading p { color: var(--ink-muted); margin: 0.6rem 0 0; }

.grid-3 { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
.card { background: var(--bg-raised); border: 1px solid var(--hairline-soft); border-radius: var(--radius-md); padding: 1.4rem; }
.card .icon { font-size: 1.6rem; display: inline-flex; width: 3rem; height: 3rem; align-items: center; justify-content: center; border-radius: 12px; background: var(--panel); margin-bottom: 0.8rem; }
.card h3 { font-size: 1.08rem; margin-bottom: 0.4rem; }
.card p { color: var(--ink-muted); margin: 0; font-size: 0.95rem; }

.steps { display: grid; gap: 1.1rem; max-width: 44rem; margin: 0 auto; padding: 0; list-style: none; }
.step { display: grid; grid-template-columns: 2.75rem 1fr; gap: 1rem; align-items: start; }
.step-num {
  width: 2.75rem; height: 2.75rem; border-radius: 999px; background: var(--gold);
  color: var(--ink); font-family: var(--font-display); font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.step h3 { font-size: 1.05rem; margin-bottom: 0.25rem; }
.step p { margin: 0; color: var(--ink-muted); font-size: 0.95rem; }

.stats { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); text-align: center; }
.stat strong { display: block; font-family: var(--font-display); font-size: 2rem; color: var(--green-deep); }
.stat span { color: var(--ink-muted); font-size: 0.9rem; }

.cta-panel {
  background: linear-gradient(135deg, var(--green-deep), var(--green)); color: #fff;
  border-radius: var(--radius-lg); padding: 2.5rem 1.5rem; text-align: center;
}
.cta-panel h2 { color: #fff; font-size: clamp(1.4rem, 3vw, 1.9rem); }
.cta-panel p { color: rgba(255,255,255,0.9); max-width: 34rem; margin: 0.75rem auto 1.5rem; }

.store-badge {
  display: inline-flex; align-items: center; gap: 0.6rem; min-height: 52px; padding: 0.4rem 1.1rem;
  border-radius: 12px; background: #000; color: #fff; font-size: 0.75rem; line-height: 1.2;
}
.store-badge:hover { text-decoration: none; filter: brightness(1.2); }
.store-badge strong { display: block; font-size: 1.05rem; }
.store-badge svg { width: 24px; height: 24px; }

.faq-item { border-bottom: 1px solid var(--hairline); padding: 0.4rem 0; }
.faq-item summary { cursor: pointer; font-weight: 600; min-height: 48px; display: flex; align-items: center; justify-content: space-between; gap: 1rem; list-style: none; }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after { content: "+"; font-size: 1.4rem; color: var(--green); flex-shrink: 0; }
.faq-item[open] summary::after { content: "–"; }
.faq-item p { margin: 0 0 1rem; color: var(--ink-muted); }

.contact-grid { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
.contact-grid .card a.btn { margin-top: 1rem; }

/* ------------------------------------------------------------------ footer */

footer.site-footer { border-top: 1px solid var(--hairline); padding: 2.5rem 0 2rem; background: var(--bg-raised); }
.footer-cols { display: grid; gap: 2rem; grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr)); }
.footer-cols h3 { font-size: 0.85rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-faint); margin-bottom: 0.6rem; }
.footer-cols ul { list-style: none; margin: 0; padding: 0; }
.footer-cols li a { min-height: 40px; display: inline-flex; align-items: center; color: var(--ink-muted); font-size: 0.92rem; }
.footer-about p { color: var(--ink-muted); font-size: 0.9rem; margin: 0.6rem 0 0; }
.footer-base { margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--hairline-soft); color: var(--ink-faint); font-size: 0.82rem; }
.footer-base p { margin: 0.2rem 0; }

/* -------------------------------------------------------------- page shell */

.page-head { padding: 2.75rem 0 1.5rem; background: linear-gradient(180deg, var(--panel), var(--bg)); }
.page-head h1 { font-size: clamp(1.8rem, 4.5vw, 2.6rem); }
.page-head p { color: var(--ink-muted); margin: 0.6rem 0 0; max-width: 40rem; }
.crumbs { font-size: 0.85rem; color: var(--ink-faint); margin-bottom: 0.6rem; }
.crumbs a { color: var(--ink-faint); }

.prose { max-width: 44rem; padding-top: 1.5rem; padding-bottom: 3.5rem; }
.prose p, .prose li { color: var(--ink-muted); }
.prose h2 { font-size: 1.25rem; margin-top: 2rem; }
.prose ul { padding-left: 1.2rem; }
.prose li { margin-bottom: 0.4rem; }
.prose strong { color: var(--ink); }

.legal-meta { color: var(--ink-faint); font-size: 0.85rem; margin: 0.4rem 0 0; }
.clause { padding-top: 1.6rem; border-top: 1px solid var(--hairline-soft); margin-top: 1.6rem; }
.clause:first-of-type { border-top: none; margin-top: 0; }
.clause h2 { font-size: 1.12rem; display: flex; gap: 0.7rem; align-items: baseline; margin: 0; }
.clause-n { color: var(--green); font-size: 1rem; min-width: 1.5rem; }
.clause p, .clause ul { color: var(--ink-muted); margin: 0.6rem 0 0; }
.clause ul { padding-left: 1.2rem; }
.clause li { margin-bottom: 0.4rem; }
.clause strong { color: var(--ink); }

.data-table { width: 100%; border-collapse: collapse; margin-top: 0.8rem; font-size: 0.9rem; }
.data-table th, .data-table td { text-align: left; vertical-align: top; padding: 0.6rem; border-bottom: 1px solid var(--hairline-soft); }
.data-table th { color: var(--ink); background: var(--panel); }
.data-table td { color: var(--ink-muted); }
.table-scroll { overflow-x: auto; }

.notice { border-left: 4px solid var(--gold); background: var(--gold-light); padding: 0.9rem 1rem; border-radius: 0 var(--radius-sm) var(--radius-sm) 0; color: var(--ink); margin: 1rem 0; }
.notice.warn { border-left-color: var(--stop); background: var(--stop-bg); }

@media (max-width: 40rem) {
  section.block { padding: 2.5rem 0; }
  .hero { padding: 2.5rem 0 2rem; }
}
`;
