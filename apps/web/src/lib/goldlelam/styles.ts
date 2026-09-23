/**
 * Design system for GoldLelam's marketing/legal pages (/goldlelam/*).
 *
 * Self-contained, like `lib/agents/styles.ts` — this route has its own root
 * layout with no shared `<html>`, so it can't depend on the (site) group's
 * Tailwind stylesheet or (agents)' dark WebGL theme. Plain CSS variables, no
 * build step, no extra webfont request: headings use a system serif stack
 * (Georgia / Iowan Old Style / Times) as a stand-in for the real serif
 * wordmark, which the branding pass (branding/generate.mjs, not yet built)
 * will supply as actual logo art.
 *
 * Palette: pink + rose gold, per the brief. Light theme only — a product
 * this early in its life reads more consistently in one theme than in a
 * half-tuned dark variant, and `color-scheme: light` tells the browser chrome
 * (scrollbars, form controls) to match rather than guess.
 */
export const GOLDLELAM_STYLES = String.raw`
:root {
  --font-serif: Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, serif;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;

  --bg: #fff8fa;
  --bg-raised: #ffffff;
  --panel: #fdeef3;

  --ink: #341522;
  --ink-muted: #6b4a58;
  --ink-faint: #8c6c79;

  --rose: #d94f7a;
  --rose-deep: #a83a5e;
  --rose-gold: #b98b6f;
  --rose-gold-light: #e7c9b6;

  --hairline: rgba(52, 21, 34, 0.12);
  --hairline-soft: rgba(52, 21, 34, 0.07);
  --stop: #c0392b;
  --stop-bg: rgba(192, 57, 43, 0.07);

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 22px;

  --shadow-soft: 0 12px 32px rgba(169, 58, 94, 0.12);
}

* { box-sizing: border-box; }

html { color-scheme: light; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a { color: var(--rose-deep); text-decoration: none; }
a:hover { text-decoration: underline; }

h1, h2, h3 { font-family: var(--font-serif); color: var(--ink); line-height: 1.15; margin: 0; }

.wrap { max-width: 64rem; margin: 0 auto; padding: 0 1.5rem; }

/* -------------------------------------------------------------- masthead */

.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid var(--hairline-soft);
  background: var(--bg-raised);
}

.masthead-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--ink);
}

.masthead-brand .mark {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--rose), var(--rose-gold));
  flex-shrink: 0;
}

.masthead nav {
  display: flex;
  gap: 1.25rem;
  font-size: 0.9rem;
  color: var(--ink-muted);
}

.masthead nav a { min-height: 44px; display: inline-flex; align-items: center; color: var(--ink-muted); }
.masthead nav a:hover { color: var(--rose-deep); }

/* ------------------------------------------------------------------ hero */

.hero {
  padding: 4rem 0 3rem;
  text-align: center;
  background:
    radial-gradient(60% 60% at 50% 0%, var(--panel) 0%, transparent 70%),
    var(--bg);
}

.hero .eyebrow {
  display: inline-block;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rose-deep);
  margin-bottom: 1rem;
}

.hero h1 {
  font-size: clamp(2.1rem, 5vw, 3.2rem);
  max-width: 40rem;
  margin: 0 auto;
}

.hero p.lede {
  max-width: 34rem;
  margin: 1.25rem auto 0;
  color: var(--ink-muted);
  font-size: 1.1rem;
}

.hero-actions {
  display: flex;
  gap: 0.9rem;
  justify-content: center;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 1.4rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
}

.btn-primary {
  background: linear-gradient(135deg, var(--rose), var(--rose-deep));
  color: #fff;
  box-shadow: var(--shadow-soft);
}
.btn-primary:hover { text-decoration: none; filter: brightness(1.05); }

.btn-secondary {
  background: var(--bg-raised);
  color: var(--ink);
  border: 1px solid var(--hairline);
}
.btn-secondary:hover { text-decoration: none; border-color: var(--rose-gold); }

/* --------------------------------------------------------- store badges */

.store-badges { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1.75rem; flex-wrap: wrap; }

.store-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  min-height: 44px;
  padding: 0.45rem 1.1rem;
  border-radius: var(--radius-sm);
  border: 1px dashed var(--rose-gold);
  color: var(--ink-muted);
  font-size: 0.78rem;
  background: var(--bg-raised);
}
.store-badge strong { font-size: 0.92rem; color: var(--ink); font-family: var(--font-sans); }

/* --------------------------------------------------------------- screens */

.screens {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding: 0.5rem 0 1rem;
  margin-top: 2.5rem;
  scroll-snap-type: x proximity;
}

.screen-placeholder {
  flex: 0 0 auto;
  scroll-snap-align: start;
  width: 11.5rem;
  aspect-ratio: 9 / 19.5;
  border-radius: 1.4rem;
  border: 1px solid var(--hairline);
  background: linear-gradient(160deg, var(--panel), var(--bg-raised));
  display: flex;
  align-items: flex-end;
  padding: 0.9rem;
  color: var(--ink-faint);
  font-size: 0.78rem;
}

/* ------------------------------------------------------------- sections */

section.block { padding: 3.5rem 0; }
section.block.alt { background: var(--panel); }
section.block.alt + section.block.alt { padding-top: 0; }

.section-heading { text-align: center; margin-bottom: 2.25rem; }
.section-heading h2 { font-size: clamp(1.6rem, 3vw, 2.1rem); }
.section-heading p { color: var(--ink-muted); margin-top: 0.6rem; }

.grid-2 { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); }
.grid-4 { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr)); }

.card {
  background: var(--bg-raised);
  border: 1px solid var(--hairline-soft);
  border-radius: var(--radius-md);
  padding: 1.5rem;
}
.card h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
.card p { color: var(--ink-muted); margin: 0; font-size: 0.95rem; }

.steps { counter-reset: step; display: grid; gap: 1.25rem; }
.step {
  display: grid;
  grid-template-columns: 2.75rem 1fr;
  gap: 1rem;
  align-items: start;
}
.step-num {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--rose-gold-light), var(--rose-gold));
  color: var(--ink);
  font-family: var(--font-serif);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step h3 { font-size: 1.05rem; margin-bottom: 0.3rem; }
.step p { margin: 0; color: var(--ink-muted); font-size: 0.95rem; }

.cta-panel {
  background: linear-gradient(135deg, var(--rose-deep), var(--rose));
  color: #fff;
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  text-align: center;
}
.cta-panel h2 { color: #fff; font-size: 1.5rem; }
.cta-panel p { color: rgba(255,255,255,0.9); max-width: 32rem; margin: 0.75rem auto 1.5rem; }
.cta-panel .btn-primary { background: #fff; color: var(--rose-deep); box-shadow: none; }

.faq-item {
  border-bottom: 1px solid var(--hairline-soft);
  padding: 1.1rem 0;
}
.faq-item summary {
  cursor: pointer;
  font-weight: 600;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.faq-item p { margin: 0.6rem 0 0; color: var(--ink-muted); }

/* ------------------------------------------------------------------ footer */

footer.site-footer {
  border-top: 1px solid var(--hairline);
  padding: 2.5rem 0;
  background: var(--bg-raised);
}
.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--ink-muted);
  font-size: 0.85rem;
}
.footer-brand .calecute-mark {
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 5px;
  background: var(--ink);
  flex-shrink: 0;
}
.footer-legal-lines p { margin: 0.15rem 0; color: var(--ink-faint); font-size: 0.8rem; }
.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  margin-top: 1.25rem;
  font-size: 0.85rem;
}
.footer-links a { min-height: 44px; display: inline-flex; align-items: center; color: var(--ink-muted); }

/* -------------------------------------------------------------- legal shell */

.legal-page main.wrap { max-width: 42rem; padding-top: 2.5rem; padding-bottom: 3rem; }
.legal-page h1 { font-size: clamp(1.8rem, 4vw, 2.4rem); }
.chips-note { color: var(--ink-faint); font-size: 0.85rem; margin: 0.5rem 0 1.5rem; }
.legal-intro { color: var(--ink-muted); margin-bottom: 1.5rem; }

.clause { padding-top: 1.75rem; border-top: 1px solid var(--hairline-soft); margin-top: 1.75rem; }
.clause:first-of-type { border-top: none; margin-top: 0; }
.clause h2 {
  font-size: 1.15rem;
  display: flex;
  gap: 0.75rem;
  align-items: baseline;
  font-family: var(--font-sans);
  font-weight: 700;
}
.clause-n { color: var(--rose-deep); font-family: var(--font-serif); font-size: 1rem; }
.clause p, .clause ul { color: var(--ink-muted); margin: 0.6rem 0 0; }
.clause ul { padding-left: 1.2rem; }
.clause li { margin-bottom: 0.45rem; }
.clause strong { color: var(--ink); }

.draft-notice {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px dashed var(--stop);
  background: var(--stop-bg);
  color: var(--stop);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 1.75rem;
}

.placeholder-flag {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  color: var(--stop);
  border: 1px dashed var(--stop);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  background: var(--stop-bg);
}

/* ------------------------------------------------------------- responsive */

@media (max-width: 40rem) {
  .masthead nav { gap: 0.8rem; font-size: 0.82rem; }
  section.block { padding: 2.5rem 0; }
  .hero { padding: 3rem 0 2rem; }
}
`;
