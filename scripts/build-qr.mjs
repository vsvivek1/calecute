/**
 * Generates the downloadable BankMates QR code.
 *
 *   node scripts/build-qr.mjs
 *
 * Outputs public/bankmates/qr.svg and qr.png. Both are committed, so this only
 * needs re-running if TARGET changes — which it should not: the QR points at
 * our own page rather than at a Play listing precisely so that a printed copy
 * on a branch noticeboard keeps working after the listing goes public, and
 * keeps working if the store URL ever changes.
 *
 * Error correction is level H (tolerates ~30% damage), which is what makes it
 * safe to sit the chai mark in the middle. The mark covers about 6% of the
 * code's area — well inside that budget, and it survives a phone camera at an
 * angle in bad branch lighting.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'bankmates');

const TARGET = 'https://calecutech.com/apps/bankmates';
const NAVY = '#0B1F4D';

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
console.log(`  public/bankmates/qr.svg  (${size} modules incl. margin, ECC H)`);
console.log(`  public/bankmates/qr.png  1024×1024`);
