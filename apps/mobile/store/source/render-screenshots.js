// Screenshots the app from `flutter build web` served on http://localhost:8765 with Playwright.
// Usage: node render-screenshots.js <out-dir>
const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  // [file, css width, css height]: 1080x1920 (16:9) and 1080x2340 (19.5:9) phones
  for (const [name, w, h] of [['phone-16x9', 360, 640], ['phone-19x9', 360, 780]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 3, locale: 'en-US' });
    await p.goto('http://localhost:8765/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(4000);
    await p.screenshot({ path: `${out}/${name}-1-top.png` });
    await p.mouse.move(w / 2, h / 2);
    for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(150); }
    await p.waitForTimeout(1000);
    await p.screenshot({ path: `${out}/${name}-2-bottom.png` });
    await p.close();
  }
  await b.close();
})();
