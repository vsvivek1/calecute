/**
 * Design system for the agent programme.
 *
 * Direction: a modern dark canvas with a live WebGL layer behind the content,
 * glass surfaces floating over it, a generous type scale and motion on scroll.
 *
 * What this replaced, and why it is written down: the first version was built to
 * a 150KB budget with no JavaScript, because the original brief argued that a
 * quiet, notice-like page was what would convince a scam-sceptical reader. The
 * client chose the 3D direction instead, which supersedes that budget and the
 * JS-disabled requirement. Both trade-offs are recorded in the README.
 *
 * What did NOT change, because it is substance rather than style:
 *   - Malayalam primary, English a secondary gloss beneath. Never a toggle.
 *   - No earnings figure anywhere.
 *   - Commission terms, including the TDS deduction, stated in full and given
 *     prominence rather than buried.
 *   - The MCA verification invitation.
 *   - 44px tap targets, AA contrast, and a layout that survives 200% zoom.
 *   - prefers-reduced-motion turns off every animation, including the 3D scene.
 */
export const AGENT_STYLES = String.raw`
/* ------------------------------------------------------------------ font */

@font-face {
  font-family: "Noto Sans Malayalam Subset";
  src: url("/fonts/noto-malayalam-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0D00-0D7F, U+200C-200D;
}

:root {
  --font-latin: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --font-ml: "Noto Sans Malayalam Subset", var(--font-latin);

  /* Deep, slightly blue-black. Pure #000 makes the WebGL layer look detached. */
  --bg: #06080c;
  --bg-raised: #0b0e14;

  --ink: #f2f5f9;          /* 17:1 on --bg */
  --ink-muted: #9aa6b8;    /* 8.1:1  — AA for body text */
  --ink-faint: #7d8798;    /* 5.6:1  — AA at 16px+ */

  /* Kerala green through backwater teal. Used for emphasis, never for alarm. */
  --accent: #34d399;
  --accent-2: #22d3ee;
  --accent-deep: #0f766e;
  --gold: #fbbf24;         /* official/verification cues only */
  --stop: #fb7185;

  /*
   * Panels are tinted DARK, not white-translucent. A white glass panel over the
   * WebGL field let the particles read straight through the text and dropped
   * contrast well below AA. These keep the frosted look while holding the
   * background down to something text can sit on.
   */
  --glass: rgba(9, 12, 18, 0.72);
  --glass-strong: rgba(11, 15, 22, 0.82);
  --glass-subtle: rgba(255, 255, 255, 0.04);
  --hairline: rgba(255, 255, 255, 0.09);
  --hairline-strong: rgba(255, 255, 255, 0.16);

  --radius: 18px;
  --radius-sm: 10px;

  --shadow-near: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-far: 0 24px 60px -18px rgba(0, 0, 0, 0.85);

  --measure: 44rem;
}

* { box-sizing: border-box; }

html {
  font-size: 100%;
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ml);
  font-size: 1.0625rem;
  line-height: 1.7;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* The WebGL canvas sits behind everything and never intercepts input. */
.scene-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.scene-layer canvas { display: block; width: 100%; height: 100%; }

/*
 * A soft vignette over the scene. Without it, text sitting on the brighter
 * parts of the animation drops below AA contrast as the scene moves.
 */
.scene-veil {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(135% 62% at 52% 4%, transparent 0%, rgba(6, 8, 12, 0.55) 58%, var(--bg) 88%),
    linear-gradient(to bottom, rgba(6, 8, 12, 0.1) 0%, rgba(6, 8, 12, 0.45) 42%, rgba(6, 8, 12, 0.9) 70%, var(--bg) 100%);
}

.content { position: relative; z-index: 2; }

.wrap {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 0 1.25rem 6rem;
}

/* ---------------------------------------------------------------- type */

h1, h2, h3 {
  font-weight: 400;
  line-height: 1.25;
  margin: 0 0 0.6rem;
  letter-spacing: -0.02em;
}

h1 { font-size: clamp(1.9rem, 6vw, 3.1rem); }
h2 { font-size: clamp(1.35rem, 3.6vw, 1.85rem); }
h3 { font-size: 1.1rem; }

p { margin: 0 0 1rem; }
p:last-child { margin-bottom: 0; }

.eyebrow {
  font-family: var(--font-latin);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 1rem;
  display: block;
}

/* ----------------------------------------------------------- bilingual */

.ml { display: block; }

.en {
  display: block;
  font-family: var(--font-latin);
  font-size: 0.8125em;
  line-height: 1.55;
  color: var(--ink-faint);
  margin-top: 0.3em;
  letter-spacing: 0;
}

.bi { margin-bottom: 1rem; }
.bi:last-child { margin-bottom: 0; }

/* ---------------------------------------------------------------- hero */

.hero {
  min-height: 88vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 5rem 0 4rem;
}

.hero h1 .en { font-size: 0.42em; margin-top: 0.6em; }

.hero-sub { max-width: 32rem; color: var(--ink-muted); margin-top: 1.5rem; }
.hero-sub .en { color: var(--ink-faint); }

/* -------------------------------------------------------------- glass */

.panel {
  position: relative;
  background: var(--glass);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: 1.6rem 1.5rem;
  backdrop-filter: blur(20px) saturate(140%);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  box-shadow: var(--shadow-far);
}

.panel + .panel { margin-top: 1rem; }

/* The terms box: the one surface given a lit edge, because full disclosure is
   the argument this page is making and it should look deliberate. */
.panel.emphasis {
  background: var(--glass-strong);
  border-color: var(--hairline-strong);
}

.panel.emphasis::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(140deg, var(--accent), transparent 45%, var(--accent-2));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.55;
}

section { padding: 3.25rem 0 0; }

/* ---------------------------------------------------------- identity */

.masthead {
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  background: rgba(6, 8, 12, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--hairline);
}

.masthead .mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  flex: 0 0 auto;
  background: linear-gradient(140deg, var(--accent), var(--accent-2));
  box-shadow: 0 0 24px -4px var(--accent);
}

.masthead .who {
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  line-height: 1.3;
  color: var(--ink-muted);
  min-width: 0;
}

/* Applies in both shells: the marketing masthead and the app bar. */
.who strong { color: var(--ink); font-weight: 600; display: block; }

.identity {
  display: grid;
  gap: 0.75rem;
  font-family: var(--font-latin);
  font-size: 0.875rem;
  margin: 0;
}

.identity div {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  flex-wrap: wrap;
  margin: 0;
}

.identity dt {
  color: var(--ink-faint);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  min-width: 5.5rem;
}

.identity dd { margin: 0; color: var(--ink); }

.cin-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.08em;
  color: var(--gold);
}

/* --------------------------------------------------------------- lists */

.terms-list, .plain-list { list-style: none; margin: 0; padding: 0; }

/*
 * The counter is positioned absolutely rather than made a grid cell. As a grid,
 * the Malayalam and English runs inside each <li> became separate grid items:
 * the English wrapped into the 1.5rem counter column and rendered one word per
 * line. Caught in review of the TDS line, which is the last thing on this page
 * that should be hard to read.
 */
.terms-list > li {
  position: relative;
  padding: 0.9rem 0 0.9rem 1.9rem;
  border-top: 1px solid var(--hairline);
}
.terms-list > li:first-child { border-top: 0; padding-top: 0.25rem; }

.terms-list > li::before {
  content: counter(term);
  counter-increment: term;
  position: absolute;
  left: 0;
  top: 1.15em;
  font-family: var(--font-latin);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}
.terms-list > li:first-child::before { top: 0.5em; }
.terms-list { counter-reset: term; }

.plain-list > li {
  padding: 0.55rem 0 0.55rem 1.9rem;
  position: relative;
}

/* A struck-through dot: these are the things we do NOT ask for. */
.plain-list > li::before {
  content: "";
  position: absolute;
  left: 0.15rem;
  top: 0.95em;
  width: 0.85rem;
  height: 0.85rem;
  border: 1.5px solid var(--accent);
  border-radius: 50%;
  opacity: 0.75;
}
.plain-list > li::after {
  content: "";
  position: absolute;
  left: 0.3rem;
  top: 1.33em;
  width: 0.55rem;
  height: 1.5px;
  background: var(--accent);
  opacity: 0.75;
}

/* ------------------------------------------------------------ controls */

.button, button, input[type="submit"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0.75rem 1.5rem;
  font: inherit;
  font-size: 1rem;
  color: #04130d;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border: 0;
  border-radius: 999px;
  text-decoration: none;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 10px 30px -12px var(--accent), var(--shadow-near);
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
}

.button:hover, button:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow: 0 16px 40px -14px var(--accent), var(--shadow-near);
}

.button:active, button:active { transform: translateY(0); }

.button .en { color: #04130d; opacity: 0.7; margin-top: 0.1em; }

.button.secondary {
  color: var(--ink);
  background: var(--glass-strong);
  border: 1px solid var(--hairline-strong);
  box-shadow: none;
  backdrop-filter: blur(12px);
}
.button.secondary .en { color: var(--ink-faint); }

.button-note {
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  color: var(--ink-faint);
  margin-top: 0.85rem;
}

label { display: block; margin-bottom: 0.4rem; }
.field { margin-bottom: 1.4rem; }

.field-hint {
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  color: var(--ink-faint);
  margin-top: 0.4rem;
}

input[type="text"], input[type="tel"], input[type="search"],
input[type="date"], input[type="number"],
select, textarea {
  display: block;
  width: 100%;
  min-height: 48px;
  padding: 0.7rem 0.9rem;
  font: inherit;
  font-size: 1rem;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--hairline-strong);
  border-radius: var(--radius-sm);
  transition: border-color 140ms ease, background 140ms ease;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.06);
}

select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--ink-muted) 50%),
    linear-gradient(135deg, var(--ink-muted) 50%, transparent 50%);
  background-position: calc(100% - 20px) calc(1.4em), calc(100% - 15px) calc(1.4em);
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 2.5rem;
}

option { background: var(--bg-raised); color: var(--ink); }

/* The native date picker indicator is black-on-black in a dark theme. */
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.55;
  cursor: pointer;
}

:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

fieldset {
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 1rem 1.1rem;
  margin: 0 0 1.4rem;
}

legend { padding: 0 0.45rem; color: var(--ink-muted); }

.choice {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  min-height: 44px;
  padding: 0.4rem 0;
}
.choice input { margin-top: 0.6rem; width: 1.15rem; height: 1.15rem; accent-color: var(--accent); }
.choice label { margin: 0; }

.trap { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }

/* -------------------------------------------------------------- notices */

.notice {
  border-left: 2px solid var(--accent);
  padding: 0.85rem 0 0.85rem 1rem;
  margin: 1.1rem 0;
  background: linear-gradient(90deg, rgba(52, 211, 153, 0.07), transparent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.notice.warn { border-left-color: var(--gold); background: linear-gradient(90deg, rgba(251, 191, 36, 0.08), transparent); }
.notice.stop { border-left-color: var(--stop); background: linear-gradient(90deg, rgba(251, 113, 133, 0.08), transparent); }

.placeholder-flag {
  display: inline-block;
  font-family: var(--font-latin);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  color: var(--stop);
  border: 1px dashed var(--stop);
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  background: rgba(251, 113, 133, 0.07);
}

/* ---------------------------------------------------------- availability */

.slots {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin: 1rem 0 0.5rem;
  font-family: var(--font-latin);
}

.slots .count {
  font-size: clamp(2.6rem, 9vw, 3.6rem);
  line-height: 1;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(140deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.slots .of { color: var(--ink-faint); font-size: 0.9rem; }

.slot-meter {
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  margin: 0.75rem 0 1.25rem;
}

.slot-meter > span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}

/* ----------------------------------------------------------------- link */

a { color: var(--accent); text-underline-offset: 3px; }
a:hover { color: var(--accent-2); }

.verify-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 48px;
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--hairline-strong);
  border-radius: 999px;
  text-decoration: none;
  background: var(--glass);
  backdrop-filter: blur(12px);
}
.verify-link:hover { border-color: var(--accent); background: var(--glass-strong); }

/* --------------------------------------------------------------- footer */

.page-footer {
  margin-top: 4rem;
  padding-top: 1.75rem;
  border-top: 1px solid var(--hairline);
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  color: var(--ink-faint);
  line-height: 1.8;
}

.page-footer a { color: var(--ink-muted); }
.footer-links { display: flex; flex-wrap: wrap; gap: 1.25rem; margin-top: 1rem; }
.footer-links a { min-height: 44px; line-height: 44px; }

/* ------------------------------------------------- registration strip */

/* The CIN and its verification link, presented as a fact rather than a case. */
.reg-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem 1.5rem;
  padding: 0.9rem 1.15rem;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  background: var(--glass);
  backdrop-filter: blur(14px);
}

.reg-strip > div { display: flex; align-items: baseline; gap: 0.6rem; }

.reg-label {
  font-family: var(--font-latin);
  font-size: 0.7rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

.reg-verify {
  margin-left: auto;
  font-size: 0.9rem;
  text-decoration: none;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
.reg-verify .en { color: var(--ink-faint); }

/* -------------------------------------------------------------- chips */

/* "No fee / No deposit / Nothing to buy / No PAN yet" — four facts on a line. */
.chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.chips > li {
  padding: 0.55rem 1rem;
  border: 1px solid var(--hairline-strong);
  border-radius: 999px;
  background: var(--glass);
  backdrop-filter: blur(12px);
  font-size: 0.95rem;
}

.chips > li .en { font-size: 0.75em; }

.chips-note {
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  color: var(--ink-faint);
  margin-top: 0.9rem;
}
.chips-note .ml { font-family: var(--font-ml); font-size: 0.95rem; color: var(--ink-muted); }

/* --------------------------------------------------------------- pair */

.pair { display: grid; gap: 2rem; }

@media (min-width: 46rem) {
  .pair { grid-template-columns: 1fr 1fr; gap: 2.5rem; }
}

/* Visually hidden but available to assistive technology. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* -------------------------------------------------------- agent sharing */

.share-grid { display: grid; gap: 1.75rem; }

@media (min-width: 44rem) {
  .share-grid { grid-template-columns: 1fr auto; align-items: start; gap: 2.5rem; }
}

.qr-holder { display: grid; gap: 0.6rem; justify-items: center; }

.share-row { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.share-row .button { width: auto; min-width: 0; flex: 1 1 12rem; }

/* --------------------------------------------------------- scroll reveal */

/*
 * Opacity and a small translate only — nothing that reflows, so this cannot
 * cause layout shift. Elements start visible and the script opts them in, so a
 * failure to load JavaScript leaves the content readable rather than invisible.
 */
.reveal-ready .reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 640ms cubic-bezier(0.22, 1, 0.36, 1),
              transform 640ms cubic-bezier(0.22, 1, 0.36, 1);
}

.reveal-ready .reveal.shown { opacity: 1; transform: none; }

/* ---------------------------------------------------------- dashboards */

/*
 * The authenticated areas get a still backdrop rather than the WebGL scene.
 * Particles drifting behind a coverage table are a distraction, and loading
 * 130KB of Three.js on every admin page view buys nothing — the scene is a
 * first-impression device for the public page, not a work surface.
 */
.app-shell {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  background:
    radial-gradient(90% 55% at 12% -8%, rgba(52, 211, 153, 0.09), transparent 62%),
    radial-gradient(70% 50% at 92% 4%, rgba(34, 211, 238, 0.07), transparent 60%),
    var(--bg);
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(6, 8, 12, 0.72);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--hairline);
  position: sticky;
  top: 0;
  z-index: 5;
}

.bar form { margin: 0; }
.bar button { width: auto; min-height: 40px; padding: 0.4rem 1rem; font-size: 0.875rem; }

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.75rem;
  margin: 1.25rem 0;
}

.stat {
  background: var(--glass);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  padding: 1.1rem 1.2rem;
  font-family: var(--font-latin);
  backdrop-filter: blur(12px);
}

.stat .label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
}

.stat .value {
  font-size: 1.75rem;
  line-height: 1.15;
  margin-top: 0.4rem;
  font-variant-numeric: tabular-nums;
}

.stat.accent .value {
  background: linear-gradient(140deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-latin);
  font-size: 0.875rem;
}

.data-table th, .data-table td {
  text-align: left;
  padding: 0.7rem 0.75rem;
  border-bottom: 1px solid var(--hairline);
  vertical-align: top;
}

.data-table th {
  font-weight: 600;
  white-space: nowrap;
  color: var(--ink-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  position: sticky;
  top: 0;
  background: var(--bg-raised);
}

.data-table tbody tr:hover { background: rgba(255, 255, 255, 0.025); }
.data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }

.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-sm);
  background: var(--glass);
}

.admin-wrap { max-width: 76rem; margin: 0 auto; padding: 1.5rem 1.25rem 5rem; }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1.5rem;
}
.filters .field { margin-bottom: 0; min-width: 10rem; flex: 1 1 10rem; }
.filters button { width: auto; }

.report-nav {
  list-style: none;
  margin: 0 0 1.75rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.report-nav a {
  display: inline-block;
  min-height: 44px;
  line-height: 44px;
  padding: 0 1rem;
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  text-decoration: none;
  color: var(--ink-muted);
  background: var(--glass);
  transition: border-color 140ms ease, color 140ms ease;
}

.report-nav a:hover { border-color: var(--hairline-strong); color: var(--ink); }

.report-nav a[aria-current="page"] {
  border-color: var(--accent);
  color: var(--ink);
  background: rgba(52, 211, 153, 0.1);
}

.qr {
  max-width: 220px;
  width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  background: #fff;
  padding: 0.75rem;
}

.code-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.35rem;
  letter-spacing: 0.1em;
  padding: 0.55rem 1rem;
  display: inline-block;
  border-radius: var(--radius-sm);
  background: var(--glass-strong);
  border: 1px solid var(--hairline-strong);
  color: var(--accent);
}

/* Simple CSS bar chart for coverage and revenue reports. */
.chart { display: grid; gap: 0.5rem; margin: 1rem 0 1.5rem; font-family: var(--font-latin); }
.chart-row { display: grid; grid-template-columns: 9rem 1fr 4rem; gap: 0.75rem; align-items: center; font-size: 0.8125rem; }
.chart-track { height: 10px; border-radius: 999px; background: rgba(255,255,255,0.07); overflow: hidden; }
.chart-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
.chart-row .num { text-align: right; font-variant-numeric: tabular-nums; color: var(--ink-muted); }

@media (min-width: 40rem) {
  .wrap { padding: 0 1.5rem 7rem; }
  .panel { padding: 2rem 2rem; }
  .button { width: auto; min-width: 18rem; }
}

/*
 * Reduced motion switches everything off, including the WebGL scene — the
 * canvas component checks the same query and renders a still frame.
 */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
  .reveal-ready .reveal { opacity: 1 !important; transform: none !important; }
}
`;
