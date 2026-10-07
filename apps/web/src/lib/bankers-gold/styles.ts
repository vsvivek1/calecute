/**
 * Stylesheet for /bankers-gold. Inline and self-contained, like
 * lib/goldlelam/styles.ts, because this route has its own root layout.
 *
 * A deep wine hero so the 3D metal reads as metal, then the brand's light
 * pink and rose gold for the rest of the page. Light theme only below the
 * hero, matching the app and its legal pages.
 */
export const BANKERS_GOLD_STYLES = String.raw`
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  --night: #1d0912;
  --wine: #3b0f24;
  --plum: #5a1838;
  --rose: #d94f7a;
  --rose-deep: #a83a5e;
  --rose-gold: #e3b19a;
  --gold: #f2c46d;
  --champagne: #f6e3d6;

  --bg: #fff8fa;
  --panel: #fdeef3;
  --ink: #341522;
  --ink-muted: #6b4a58;
  --hairline: rgba(52, 21, 34, 0.1);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; }
h1, h2, h3 { font-family: var(--font-display), Georgia, serif; line-height: 1.12; margin: 0; }
.wrap { max-width: 72rem; margin: 0 auto; padding: 0 1.25rem; }

/* ------------------------------------------------------------- hero */

.hero {
  position: relative;
  overflow: hidden;
  color: var(--champagne);
  background:
    radial-gradient(55% 60% at 75% 45%, rgba(217, 79, 122, 0.38) 0%, transparent 70%),
    radial-gradient(40% 40% at 10% 0%, rgba(242, 196, 109, 0.14) 0%, transparent 70%),
    linear-gradient(160deg, var(--night) 0%, var(--wine) 55%, var(--plum) 100%);
  padding-bottom: 3rem;
}
.hero::after {
  content: "";
  position: absolute;
  inset: auto 0 0 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--rose-gold), transparent);
  opacity: 0.5;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 1.1rem;
  padding-bottom: 1.1rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-display), Georgia, serif;
  font-size: 1.3rem;
  font-weight: 700;
  text-decoration: none;
  color: #fff;
}
.brand img { border-radius: 10px; background: #fff; }
.nav nav { display: flex; align-items: center; gap: 1.4rem; font-size: 0.92rem; }
.nav nav a { text-decoration: none; color: rgba(246, 227, 214, 0.78); min-height: 44px; display: inline-flex; align-items: center; }
.nav nav a:hover { color: #fff; }
.nav .nav-cta {
  padding: 0 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(227, 177, 154, 0.55);
  color: #fff;
}
.nav .nav-cta:hover { background: rgba(255, 255, 255, 0.08); }
@media (max-width: 47.99rem) {
  .nav nav a:not(.nav-cta) { display: none; }
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  align-items: center;
  gap: 2rem;
  min-height: min(42rem, 80vh);
}
@media (max-width: 55rem) {
  .hero-grid { grid-template-columns: 1fr; text-align: center; gap: 0; min-height: 0; padding-top: 1rem; }
  .hero-grid .jewel { order: -1; height: 20rem; }
  .hero-grid .badges { justify-content: center; }
}

.eyebrow {
  display: inline-block;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--rose-gold);
  margin-bottom: 1rem;
}
.eyebrow.dark { color: var(--rose-deep); }

.hero h1 { font-size: clamp(2.3rem, 5vw, 3.6rem); color: #fff; letter-spacing: -0.01em; }
.shine {
  background: linear-gradient(100deg, var(--rose-gold) 0%, var(--gold) 35%, #fff4e2 50%, var(--gold) 65%, var(--rose-gold) 100%);
  background-size: 220% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shine 7s ease-in-out infinite;
}
@keyframes shine { 0%, 100% { background-position: 100% 0; } 50% { background-position: 0 0; } }
@media (prefers-reduced-motion: reduce) { .shine { animation: none; } }

.lede { font-size: 1.15rem; max-width: 32rem; margin: 1.25rem 0 0; color: rgba(246, 227, 214, 0.82); }
@media (max-width: 55rem) { .lede { margin-left: auto; margin-right: auto; } }
.hero-note { margin: 1rem 0 0; font-size: 0.85rem; color: rgba(246, 227, 214, 0.6); }

/* ---------------------------------------------------------- badges */

.badges { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem; }
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 52px;
  padding: 0.5rem 1.2rem 0.5rem 0.95rem;
  border-radius: 14px;
  background: #0d0408;
  color: #fff;
  border: 1px solid rgba(227, 177, 154, 0.45);
  text-decoration: none;
  font-weight: 600;
  font-size: 1.05rem;
  line-height: 1.15;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.badge svg { width: 24px; height: 24px; flex-shrink: 0; }
.badge small { display: block; font-size: 0.68rem; font-weight: 500; letter-spacing: 0.03em; opacity: 0.8; }
a.badge:hover { transform: translateY(-2px); border-color: var(--gold); box-shadow: 0 10px 28px rgba(242, 196, 109, 0.25); }
.badge.is-soon { opacity: 0.6; border-style: dashed; cursor: default; }

/* ------------------------------------------------------- 3D jewel */

.jewel { position: relative; height: 34rem; width: 100%; }
.jewel-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease;
}
.jewel.is-ready .jewel-canvas { opacity: 1; }

/* The server-rendered ring, shown until (or instead of) the WebGL scene. */
.jewel-fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transition: opacity 0.6s ease;
}
.jewel.is-ready .jewel-fallback { opacity: 0; }
.jewel-fallback > span { grid-area: 1 / 1; }
.jewel-fallback-ring {
  width: min(15rem, 55vw);
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(from 200deg, #fbe0cf, var(--rose-gold), #9c6650, var(--gold), #fbe0cf, #b87c62, #fbe0cf);
  -webkit-mask: radial-gradient(circle, transparent 0 60%, #000 61%);
          mask: radial-gradient(circle, transparent 0 60%, #000 61%);
  filter: drop-shadow(0 0 40px rgba(217, 79, 122, 0.45));
}
.jewel-fallback-stone {
  width: 2.8rem;
  height: 2.8rem;
  transform: translateY(calc(-1 * min(7.5rem, 27.5vw))) rotate(45deg);
  background: linear-gradient(135deg, #fff, #ffd6e4 45%, #e8a3bd);
  box-shadow: 0 0 30px rgba(255, 214, 228, 0.6);
}

/* -------------------------------------------------------- sections */

.block { padding: 5rem 0; }
.block.alt { background: var(--panel); }
.heading { text-align: center; margin-bottom: 2.75rem; }
.heading h2, .download h2 { font-size: clamp(1.9rem, 4vw, 2.6rem); }

.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1.25rem; }
.card {
  background: #fff;
  border: 1px solid var(--hairline);
  border-radius: 20px;
  padding: 1.6rem;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(169, 58, 94, 0.12); }
.card-icon {
  display: inline-grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--rose), var(--rose-gold));
  color: #fff;
  font-size: 1.25rem;
  margin-bottom: 1rem;
}
.card h3 { font-size: 1.2rem; margin-bottom: 0.5rem; }
.card p { margin: 0; color: var(--ink-muted); font-size: 0.95rem; }

.steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 1.25rem; }
.step { position: relative; padding: 1.5rem 1.5rem 1.5rem 0; border-top: 2px solid var(--rose-gold); }
.step-num { font-family: var(--font-display), Georgia, serif; font-size: 2.2rem; color: var(--rose); font-weight: 700; }
.step h3 { font-size: 1.15rem; margin: 0.4rem 0; }
.step p { margin: 0; color: var(--ink-muted); font-size: 0.95rem; }

.panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  padding: 2.75rem;
  border-radius: 28px;
  color: var(--champagne);
  background:
    radial-gradient(60% 90% at 100% 0%, rgba(217, 79, 122, 0.35), transparent 70%),
    linear-gradient(140deg, var(--night), var(--wine));
}
.panel > div { flex: 1 1 24rem; }
.panel h2 { color: #fff; font-size: clamp(1.6rem, 3.4vw, 2.2rem); }
.panel p { color: rgba(246, 227, 214, 0.8); margin: 0.9rem 0 0; }
.btn {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  padding: 0 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  color: var(--night);
  background: linear-gradient(120deg, var(--rose-gold), var(--gold));
}
.btn:hover { filter: brightness(1.06); }

.download { text-align: center; padding-top: 1rem; }
.download .badges { justify-content: center; }

/* ---------------------------------------------------------- footer */

.footer { background: var(--night); color: rgba(246, 227, 214, 0.7); padding: 2.5rem 0; font-size: 0.9rem; }
.footer nav { display: flex; flex-wrap: wrap; gap: 0.25rem 1.25rem; margin-bottom: 1rem; }
.footer nav a { color: var(--champagne); text-decoration: none; min-height: 44px; display: inline-flex; align-items: center; }
.footer nav a:hover, .footer p a:hover { text-decoration: underline; }
.footer p { margin: 0.4rem 0; }
.footer p a { color: var(--rose-gold); text-decoration: none; }
.footer .fine { font-size: 0.8rem; opacity: 0.75; }
`;
