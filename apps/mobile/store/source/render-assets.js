// Draws the Play icon, feature graphic, launcher art and in-app mascot with Playwright.
// Usage: node render-assets.js <out-dir>
const { chromium } = require('playwright');
const INK = '#1f2433', PAPER = '#fffaf0';
const st = `stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"`;
// Head of the web ClockMascot (apps/web/src/components/history-clock/Doodles.tsx): clock, crown, face.
const head = `
<circle cx="120" cy="140" r="84" fill="${PAPER}" ${st} stroke-width="5"/>
<circle cx="120" cy="140" r="72" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="3 9"/>
<path d="M120 62 v12 M120 206 v12 M42 140 h12 M186 140 h12" ${st} stroke-width="4"/>
<path d="M70 66 L62 22 L90 44 L120 12 L150 44 L178 22 L170 66 Z" fill="#e8b64c" ${st} stroke-width="4"/>
<circle cx="120" cy="40" r="6" fill="#d9653b" stroke="${INK}" stroke-width="3"/>
<circle cx="88" cy="56" r="4" fill="#2f7f7a"/><circle cx="152" cy="56" r="4" fill="#2f7f7a"/>
<path d="M78 98 q14 -12 28 -2" fill="none" ${st} stroke-width="4"/>
<path d="M134 96 q14 -10 28 2" fill="none" ${st} stroke-width="4"/>
<ellipse cx="94" cy="118" rx="14" ry="17" fill="#fff" ${st} stroke-width="3.5"/>
<ellipse cx="146" cy="118" rx="14" ry="17" fill="#fff" ${st} stroke-width="3.5"/>
<circle cx="98" cy="122" r="6" fill="${INK}"/><circle cx="150" cy="122" r="6" fill="${INK}"/>
<circle cx="100" cy="119" r="2" fill="#fff"/><circle cx="152" cy="119" r="2" fill="#fff"/>
<ellipse cx="120" cy="146" rx="13" ry="11" fill="#d9653b" ${st} stroke-width="3.5"/>
<path d="M120 160 c-10 -6 -26 -8 -40 2 c-8 6 -18 4 -20 -6 c-2 12 8 22 22 20 c14 -2 26 -8 38 -10 c12 2 24 8 38 10 c14 2 24 -8 22 -20 c-2 10 -12 12 -20 6 c-14 -10 -30 -8 -40 -2 z" fill="${INK}"/>
<path d="M100 186 q20 14 40 0" fill="none" ${st} stroke-width="3.5"/>
<circle cx="72" cy="152" r="8" fill="#d9653b" opacity="0.35"/><circle cx="168" cy="152" r="8" fill="#d9653b" opacity="0.35"/>`;
// shadowed head: hard ink shadow like the web cards
const shadowHead = `<g transform="translate(7 7)"><circle cx="120" cy="140" r="84" fill="${INK}"/></g>` + head;
const box = (size) => { const cx = 124, cy = 120; return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`; };
const page = (w, h, body) => `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=Patrick+Hand&display=block" rel="stylesheet">
<style>html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}</style></head><body>${body}</body></html>`;
const svg = (w, h, vb, inner, bg = 'none') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}" style="display:block;background:${bg}">${inner}</svg>`;

(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const shot = async (w, h, html, file, transparent = false) => {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(html, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${out}/${file}`, omitBackground: transparent });
    await p.close();
  };
  // Play icon: full-bleed square (Play rounds the corners itself).
  await shot(512, 512, page(512, 512, svg(512, 512, box(290), shadowHead, '#2f7f7a')), 'icon-512.png');
  // Legacy launcher icon, rounded square on transparent.
  const legacy = `<rect x="${124 - 150}" y="${120 - 150}" width="300" height="300" rx="60" fill="#2f7f7a"/>` + shadowHead;
  await shot(192, 192, page(192, 192, svg(192, 192, box(300), legacy)), 'launcher-legacy.png', true);
  // Adaptive foreground: 108dp canvas, art inside the 66dp safe zone.
  await shot(432, 432, page(432, 432, svg(432, 432, box(390), shadowHead)), 'launcher-foreground.png', true);
  // Feature graphic 1024x500.
  const fg = `<div style="width:1024px;height:500px;background:#fbf3e0;background-image:radial-gradient(rgba(31,36,51,.08) 1.5px,transparent 1.5px);background-size:22px 22px;display:flex;align-items:center;gap:36px;padding:0 64px;box-sizing:border-box;font-family:'Patrick Hand',cursive;color:${INK}">
    ${svg(330, 330, box(250), shadowHead)}
    <div>
      <div style="font-size:104px;line-height:.95">History <span style="background:linear-gradient(transparent 62%,#e8b64c 62%,#e8b64c 88%,transparent 88%)">Clock</span></div>
      <div style="font-size:44px;line-height:1.1;color:#d9653b;margin-top:18px">Spin the clock.<br>Watch empires rise and fall.</div>
    </div></div>`;
  await shot(1024, 500, page(1024, 500, fg), 'feature-graphic-1024x500.png');
  await shot(1024, 1024, page(1024, 1024, svg(1024, 1024, box(290), shadowHead, '#2f7f7a')), 'icon-1024.png');
  await shot(512, 512, page(512, 512, svg(512, 512, box(300), legacy)), 'launcher-legacy-512.png', true);
  await shot(480, 480, page(480, 480, svg(480, 480, box(232), shadowHead)), 'mascot.png', true);
  await b.close();
})();
