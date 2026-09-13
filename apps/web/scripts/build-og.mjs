#!/usr/bin/env node
/**
 * Builds the Open Graph image: public/og/agents.png, 1200x630.
 *
 *   npm run build:og --workspace=apps/web
 *
 * Why a script and not next/og
 * ----------------------------
 * next/og renders through Satori, which lays text out without a shaping
 * engine. Malayalam needs GSUB substitution — conjuncts, reordered vowel
 * signs, chillu forms — and without it every conjunct renders with a visible
 * chandrakkala where a ligature belongs. Verified: "കമ്മീഷൻ" came out as
 * "കമ്‌മീഷന്‍". To a Malayali reader that is broken text, on the one asset
 * that does most of the recruiting.
 *
 * sharp rasterises SVG through librsvg, which uses Pango and HarfBuzz and
 * shapes correctly. The font is embedded as a data URI rather than relied on
 * from the system, so the output is identical on any machine and matches the
 * typeface the site itself uses.
 *
 * The image is static, so generating it at request time bought nothing. It is
 * committed and served as a file.
 *
 * Why it is designed the way it is: most traffic arrives through a WhatsApp
 * forward and re-shares the same way, so this is read at roughly 200px wide in
 * a chat list. That rules out small type, long lines, boxes and detail. Three
 * short lines and one row of facts survive the shrink; anything more does not.
 * And no earnings figure, for the same reason as the page.
 */
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT_DIR = join(ROOT, "public", "og");

const WIDTH = 1200;
const HEIGHT = 630;

const INK = "#f2f5f9";
const MUTED = "#9aa6b8";
const FAINT = "#7d8798";
const ACCENT = "#34d399";
const BG = "#06080c";

/** XML-escape, so a copy change with an ampersand cannot break the render. */
function esc(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const content = {
  eyebrow: "CALECUTE TECHNOLOGIES",
  headline: ["കമ്മീഷൻ ഏജന്റുമാരെ", "ആവശ്യമുണ്ട്"],
  sub: "ഓരോ പഞ്ചായത്തിലും 10 ഏജന്റുമാർ",
  // Phrased as a statement, not a row of badges. Reassurance that is given
  // emphasis reads as protesting; the same words in a sentence just read as
  // how the arrangement works.
  facts: "രജിസ്ട്രേഷൻ ഫീസില്ല. കമ്മീഷൻ 10%.",
  url: "calecutech.com/agents",
};

async function main() {
  const ttf = await readFile(
    join(ROOT, "fonts", "source", "NotoSansMalayalam-Regular.ttf"),
  );
  const embedded = ttf.toString("base64");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <style type="text/css">
      @font-face {
        font-family: "CalecuteML";
        src: url("data:font/ttf;base64,${embedded}") format("truetype");
      }
      .ml { font-family: "CalecuteML"; }
      .latin { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }
    </style>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BG}"/>

  <!-- A single hairline in the accent, top-left. The only ornament. -->
  <rect x="80" y="72" width="46" height="3" fill="${ACCENT}"/>

  <text class="latin" x="80" y="128" font-size="23" letter-spacing="5.5"
        fill="${ACCENT}">${esc(content.eyebrow)}</text>

  <text class="ml" x="80" y="268" font-size="86" fill="${INK}">${esc(content.headline[0])}</text>
  <text class="ml" x="80" y="374" font-size="86" fill="${INK}">${esc(content.headline[1])}</text>

  <text class="ml" x="80" y="452" font-size="34" fill="${MUTED}">${esc(content.sub)}</text>

  <line x1="80" y1="512" x2="${WIDTH - 80}" y2="512" stroke="#ffffff" stroke-opacity="0.09"/>

  <text class="ml" x="80" y="566" font-size="30" fill="${INK}">${esc(content.facts)}</text>

  <text class="latin" x="${WIDTH - 80}" y="566" font-size="23" text-anchor="end"
        fill="${FAINT}">${esc(content.url)}</text>
</svg>`;

  await mkdir(OUT_DIR, { recursive: true });
  const target = join(OUT_DIR, "agents.png");

  const info = await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, palette: true })
    .toFile(target);

  console.log(`public/og/agents.png  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)}KB`);

  if (info.width !== WIDTH || info.height !== HEIGHT) {
    console.error(`Expected ${WIDTH}x${HEIGHT}. Open Graph consumers crop anything else.`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
