/**
 * Generates the downloadable QR code for an app's page.
 *
 *   node scripts/build-qr.mjs            # every app below
 *   node scripts/build-qr.mjs recallio   # just one
 *
 * Outputs public/<slug>/qr.svg and qr.png, both committed, so this only needs
 * re-running when an app is added. Each QR points at our own page rather than
 * at a Play listing precisely so that a printed copy on a noticeboard keeps
 * working after the listing goes public, and keeps working if the store URL
 * ever changes.
 *
 * Error correction is level H (tolerates ~30% damage), which is what makes it
 * safe to sit the app's mark in the middle. The mark covers about 6% of the
 * code's area — well inside that budget, and it survives a phone camera at an
 * angle in bad lighting.
 *
 * Each app needs public/<slug>/mark.png: a square, transparent logo.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** slug -> the ink colour its mark sits best against. */
const APPS = {
  bankmates: { ink: '#0B1F4D' },
  recallio: { ink: '#001B4E' },
  workforce: { ink: '#8F3600' },
};

const only = process.argv[2];
const slugs = only ? [only] : Object.keys(APPS);
for (const slug of slugs) {
  if (!APPS[slug]) throw new Error(`Unknown app "${slug}". Known: ${Object.keys(APPS).join(', ')}`);
  await build(slug, APPS[slug].ink);
}

async function build(slug, NAVY) {
const OUT = join(ROOT, 'public', slug);

const TARGET = `https://calecutech.com/apps/${slug}`;

const svg = await QRCode.toString(TARGET, {
  type: 'svg',
  errorCorrectionLevel: 'H',
  margin: 2,
  color: { dark: NAVY, light: '#ffffff' },
});

// qrcode emits viewBox="0 0 N N", where N is modules + margin on both sides.
const size = Number(/viewBox="0 0 (\d+(?:\.\d+)?)/.exec(svg)?.[1]);
if (!Number.isFinite(size)) throw new Error('Could not read the QR viewBox.');

const markPng = await readFile(join(OUT, 'mark.png'));
const markData = `data:image/png;base64,${markPng.toString('base64')}`;

// A white plate behind the mark so the modules it covers read as "quiet zone"
// rather than as damage, and the mark itself inset within it.
const plate = size * 0.26;
const plateXY = (size - plate) / 2;
const mark = plate * 0.78;
const markXY = (size - mark) / 2;

const branded = svg.replace(
  '</svg>',
  `<rect x="${plateXY.toFixed(3)}" y="${plateXY.toFixed(3)}" ` +
    `width="${plate.toFixed(3)}" height="${plate.toFixed(3)}" ` +
    `rx="${(plate * 0.18).toFixed(3)}" fill="#ffffff"/>` +
    `<image x="${markXY.toFixed(3)}" y="${markXY.toFixed(3)}" ` +
    `width="${mark.toFixed(3)}" height="${mark.toFixed(3)}" href="${markData}"/>` +
    `</svg>`,
);

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, 'qr.svg'), `${branded}\n`, 'utf8');

// 1024px PNG for printing and for pasting into WhatsApp, which will not render
// an SVG. White-flattened: a transparent QR is unscannable on a dark surface.
await sharp(Buffer.from(branded), { density: 600 })
  .resize(1024, 1024, { fit: 'contain', background: '#ffffff' })
  .flatten({ background: '#ffffff' })
  .png({ compressionLevel: 9 })
  .toFile(join(OUT, 'qr.png'));

console.log(`QR → ${TARGET}`);
console.log(`  public/${slug}/qr.svg  (${size} modules incl. margin, ECC H)`);
console.log(`  public/${slug}/qr.png  1024×1024`);
}
