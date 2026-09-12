/**
 * The stylesheet for the agent programme, as a module rather than a .css file.
 *
 * It lives here because the public recruitment page is served as a static
 * document by a route handler, which has no CSS pipeline — the styles are
 * inlined into the <head> instead. Inlining is the better choice there anyway:
 * it removes a render-blocking round trip on a connection where the round trip
 * is the expensive part.
 *
 * The app-like pages (signup, dashboards) import the same string through the
 * layout, so there is exactly one source of truth for both.
 */
export const AGENT_STYLES = String.raw`
/*
 * Styles for the recruitment page and the agent/admin areas.
 *
 * Hand-written rather than Tailwind, and deliberately so: this page has a 150KB
 * budget including fonts, of which the Malayalam subset already takes 35KB.
 * Every rule here is one the page actually uses.
 *
 * Design brief, restated because it explains the choices below: the visitor
 * arrived from a WhatsApp forward and assumes this is a scam. Kerala is
 * saturated with chit-fund and MLM recruitment. So — no gradients, no stock
 * photography, no counters, no urgency, no testimonials. It should read like a
 * notice from an organisation that does not need to persuade you.
 */

/* ------------------------------------------------------------------ font */

/*
 * Self-hosted and subset. \`unicode-range\` is what keeps it honest: the browser
 * only downloads this file when Malayalam is actually on the page, and Latin
 * text never triggers it.
 *
 * \`font-display: swap\` so text is readable immediately on a slow connection —
 * a blank page for two seconds is worse than a brief fallback, especially for a
 * reader deciding whether to trust the page at all.
 */
@font-face {
  font-family: "Noto Sans Malayalam Subset";
  src: url("/fonts/noto-malayalam-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0D00-0D7F, U+200C-200D;
}

:root {
  /* Latin uses the system stack: nothing to download, and it is what the rest
     of the phone's UI looks like, which reads as ordinary rather than styled. */
  --font-latin: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  --font-ml: "Noto Sans Malayalam Subset", var(--font-latin);

  --ink: #1a1a1a;          /* 16.1:1 on white */
  --ink-muted: #565656;    /* 7.4:1 — AA for body text, not just large */
  --ink-faint: #6b6b6b;    /* 5.3:1 — AA for text 16px and above */
  --rule: #d4d4d4;
  --rule-strong: #1a1a1a;
  --paper: #ffffff;
  --paper-tint: #f7f7f5;
  --link: #14487e;         /* 8.6:1 */
  --ok: #1c6b3f;           /* 5.4:1 */
  --warn: #8a5a00;         /* 5.1:1 */
  --stop: #9b1c1c;         /* 7.0:1 */

  --measure: 34rem;        /* comfortable line length for both scripts */
}

/* Respect the reader's own settings; nothing here overrides a chosen theme. */
@media (prefers-color-scheme: dark) {
  :root {
    --ink: #ededed;
    --ink-muted: #b4b4b4;
    --ink-faint: #9a9a9a;
    --rule: #3a3a3a;
    --rule-strong: #ededed;
    --paper: #121212;
    --paper-tint: #1b1b1b;
    --link: #8ab4f8;
    --ok: #6bbf8a;
    --warn: #e0b055;
    --stop: #f08b8b;
  }
}

/* ------------------------------------------------------------- structure */

* { box-sizing: border-box; }

html {
  /* rem-based sizing throughout, so 200% browser zoom scales everything. */
  font-size: 100%;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-ml);
  /* 1.125rem: Malayalam conjuncts are dense and lose legibility below this on a
     small screen. */
  font-size: 1.125rem;
  line-height: 1.65;
}

.wrap {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 1.5rem 1.25rem 4rem;
}

/* A thin rule between sections rather than cards or shadows. */
section + section {
  margin-top: 2.25rem;
  padding-top: 2.25rem;
  border-top: 1px solid var(--rule);
}

h1, h2, h3 {
  font-weight: 400;   /* only one weight is shipped; hierarchy is size + space */
  line-height: 1.35;
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}

h1 { font-size: 1.6rem; }
h2 { font-size: 1.25rem; }
h3 { font-size: 1.05rem; }

p { margin: 0 0 0.9rem; }
p:last-child { margin-bottom: 0; }

/* ------------------------------------------------------------- bilingual */

/*
 * Malayalam primary, English secondary — both always rendered, never a toggle.
 * The English sits directly beneath its Malayalam, smaller and muted, so a
 * reader of either language can follow the page without choosing anything.
 */
.ml { display: block; }

.en {
  display: block;
  font-family: var(--font-latin);
  font-size: 0.8125em;
  line-height: 1.5;
  color: var(--ink-faint);
  margin-top: 0.15em;
}

.bi { margin-bottom: 0.9rem; }
.bi:last-child { margin-bottom: 0; }

/* --------------------------------------------------------------- header */

.masthead {
  border-bottom: 2px solid var(--rule-strong);
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}

.masthead .legal-name {
  font-size: 1.0625rem;
  line-height: 1.4;
}

.identity {
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  color: var(--ink-muted);
  margin-top: 0.5rem;
  line-height: 1.7;
}

.identity dt {
  display: inline;
  font-weight: 600;
}
.identity dd {
  display: inline;
  margin: 0 0 0 0.25rem;
}
/* Each row on its own line; label and value inline within it. */
.identity div { margin: 0; display: block; }

/* ---------------------------------------------------------- commission */

/*
 * The terms box. Bordered and stated in full, immediately, including the TDS
 * deduction — disclosure is the conversion mechanism on this page, so it is
 * given prominence rather than tucked into a footnote.
 */
.terms-box {
  border: 2px solid var(--rule-strong);
  padding: 1.1rem 1.15rem;
  margin: 0.25rem 0 0;
}

.terms-box h2 { margin-bottom: 0.75rem; }

.terms-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.terms-list > li {
  padding: 0.55rem 0;
  border-top: 1px solid var(--rule);
}
.terms-list > li:first-child { border-top: 0; padding-top: 0; }
.terms-list > li:last-child { padding-bottom: 0; }

/* ------------------------------------------------------------ not-asked */

.plain-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.plain-list > li {
  position: relative;
  padding-left: 1.35rem;
  margin-bottom: 0.7rem;
}

/* A rule, not a tick: a checklist of reassurances reads as marketing. */
.plain-list > li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.72em;
  width: 0.8rem;
  height: 1px;
  background: var(--ink-faint);
}

/* ------------------------------------------------------------- controls */

/*
 * Tap targets are 44px minimum throughout. The target device is a cheap phone
 * held in one hand, often by someone who is not a confident typist.
 */
.button,
button,
input[type="submit"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.65rem 1.1rem;
  font: inherit;
  font-size: 1rem;
  color: var(--paper);
  background: var(--ink);
  border: 2px solid var(--ink);
  border-radius: 2px;
  text-decoration: none;
  cursor: pointer;
  width: 100%;
}

.button:hover,
button:hover { opacity: 0.88; }

.button.secondary {
  color: var(--ink);
  background: transparent;
}

.button .en { color: inherit; opacity: 0.75; margin-top: 0; }

.button-note {
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  color: var(--ink-faint);
  margin-top: 0.6rem;
}

label {
  display: block;
  margin-bottom: 0.3rem;
}

/* Labels are real labels, never placeholder-only. */
.field { margin-bottom: 1.35rem; }

.field-hint {
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  color: var(--ink-faint);
  margin-top: 0.35rem;
}

input[type="text"],
input[type="tel"],
input[type="search"],
select,
textarea {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 0.55rem 0.7rem;
  font: inherit;
  font-size: 1rem;
  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--ink-muted);
  border-radius: 2px;
}

select { appearance: none; background-image: none; }

:focus-visible {
  outline: 3px solid var(--link);
  outline-offset: 2px;
}

fieldset {
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 0.9rem 1rem;
  margin: 0 0 1.35rem;
}

legend { padding: 0 0.4rem; }

.choice {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  min-height: 44px;
  padding: 0.35rem 0;
}

.choice input { margin-top: 0.55rem; width: 1.15rem; height: 1.15rem; }
.choice label { margin: 0; }

/* The honeypot. Hidden from sight and from assistive technology, but a bot
   filling every input will still trip it. Not display:none — some bots skip
   those. */
.trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

/* -------------------------------------------------------------- notices */

.notice {
  border-left: 3px solid var(--rule-strong);
  padding: 0.75rem 0 0.75rem 0.9rem;
  margin: 1rem 0;
  background: var(--paper-tint);
}

.notice.ok { border-left-color: var(--ok); }
.notice.warn { border-left-color: var(--warn); }
.notice.stop { border-left-color: var(--stop); }

.placeholder-flag {
  display: inline-block;
  font-family: var(--font-latin);
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  color: var(--stop);
  border: 1px dashed var(--stop);
  padding: 0.1rem 0.35rem;
  border-radius: 2px;
}

/* -------------------------------------------------------- availability */

.slots {
  font-family: var(--font-latin);
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin: 0.75rem 0 0.25rem;
}

.slots .count {
  font-size: 2rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.slots .of { color: var(--ink-faint); font-size: 0.9rem; }

/* ----------------------------------------------------------------- link */

a { color: var(--link); }
a:hover { text-decoration-thickness: 2px; }

.verify-link {
  display: inline-block;
  min-height: 44px;
  line-height: 44px;
}

/* --------------------------------------------------------------- footer */

.page-footer {
  margin-top: 3rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--rule);
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  color: var(--ink-muted);
  line-height: 1.7;
}

.page-footer a { color: var(--ink-muted); }

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.75rem;
}

.footer-links a { min-height: 44px; line-height: 44px; }

/* --------------------------------------------------------- dashboards */

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--rule-strong);
}

.bar form { margin: 0; }
.bar button { width: auto; min-height: 44px; }

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
  gap: 1px;
  background: var(--rule);
  border: 1px solid var(--rule);
  margin: 1rem 0;
}

.stat {
  background: var(--paper);
  padding: 0.9rem 1rem;
  font-family: var(--font-latin);
}

.stat .label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-faint);
}

.stat .value {
  font-size: 1.5rem;
  line-height: 1.2;
  margin-top: 0.25rem;
  font-variant-numeric: tabular-nums;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-latin);
  font-size: 0.875rem;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 0.55rem 0.6rem;
  border-bottom: 1px solid var(--rule);
  vertical-align: top;
}

.data-table th {
  font-weight: 600;
  white-space: nowrap;
  border-bottom: 2px solid var(--rule-strong);
}

.data-table td.num { text-align: right; font-variant-numeric: tabular-nums; }

/* Wide tables scroll inside their own box; the page never scrolls sideways. */
.table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.admin-wrap { max-width: 70rem; }

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1.25rem;
}

.filters .field { margin-bottom: 0; min-width: 10rem; flex: 1 1 10rem; }
.filters button { width: auto; }

.report-nav {
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.report-nav a {
  display: inline-block;
  min-height: 44px;
  line-height: 44px;
  padding: 0 0.75rem;
  font-family: var(--font-latin);
  font-size: 0.8125rem;
  border: 1px solid var(--rule);
  border-radius: 2px;
  text-decoration: none;
  color: var(--ink);
}

.report-nav a[aria-current="page"] {
  border-color: var(--rule-strong);
  border-width: 2px;
}

.qr { max-width: 220px; width: 100%; height: auto; }

.code-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.25rem;
  letter-spacing: 0.06em;
  border: 2px solid var(--rule-strong);
  padding: 0.4rem 0.7rem;
  display: inline-block;
}

@media (min-width: 40rem) {
  .wrap { padding: 2.5rem 1.5rem 5rem; }
  h1 { font-size: 1.9rem; }
  .button { width: auto; min-width: 16rem; }
}

/* Anyone who has asked for less motion gets none; there is very little anyway. */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
`;
