#!/usr/bin/env node
/**
 * Subsets Noto Sans Malayalam to the glyphs this site actually uses.
 *
 * The full family is about 150KB per weight. The public page has a 150KB budget
 * for everything, so shipping the family is not an option — and loading it from
 * Google Fonts would be worse still: a second origin to connect to, on a
 * connection where the handshake is the expensive part.
 *
 * How the character set is chosen
 * ------------------------------
 * Every Malayalam string the site can render is collected from source, not
 * guessed. Two sources:
 *
 *   1. src/lib/agents/content.ts — the page copy.
 *   2. Every other .ts/.tsx file — so a stray Malayalam string in a component
 *      is still covered.
 *
 * Names of districts and panchayats come from the DATABASE, not from source, so
 * they cannot be collected this way. The Malayalam block is therefore included
 * in full: it is the only way "കോടഞ്ചേരി" renders when the API returns it. That
 * is the honest trade — a slightly larger file in exchange for names that
 * actually appear.
 *
 * Subsetting is done with harfbuzz (via subset-font), which computes glyph
 * closure over GSUB/GPOS. That matters for Malayalam more than for Latin:
 * conjuncts and reordered vowel signs are produced by substitution rules, so a
 * naive codepoint-only subset renders broken text.
 */
import { readFile, writeFile, mkdir, readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, "..", "src");
const FONT_SRC = join(HERE, "..", "fonts", "source");
const OUT = join(HERE, "..", "public", "fonts");

/**
 * The Malayalam this site can actually render, minus what it never will.
 *
 * The full block is U+0D00..U+0D7F, but two stretches are archaic and cost
 * bytes for nothing: U+0D58..U+0D5E are historic fractions and U+0D70..U+0D79
 * are the old Malayalam numerals and date mark. Neither appears in a modern
 * place name or in any copy on this site.
 *
 * U+0D7A..U+0D7F are NOT archaic and must stay — they are the chillu letters
 * (ൺ ൻ ർ ൽ ൾ ൿ), which end a great many Malayalam place names, Kannur
 * (കണ്ണൂർ) among them.
 */
const MALAYALAM_RANGES = [
  [0x0d00, 0x0d57], // signs, letters, vowel signs, chillu, au length mark
  [0x0d5f, 0x0d63], // vocalic RR and LL
  [0x0d66, 0x0d6f], // Malayalam digits
  [0x0d7a, 0x0d7f], // chillu letters
  [0x200c, 0x200d], // ZWNJ / ZWJ — chillu forms and conjunct control
];

/** Latin and punctuation that may appear inside a Malayalam run. */
const SHARED = " .,:;()[]/-—–‘’“”…%₹0123456789";

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function inMalayalamRange(codePoint) {
  return MALAYALAM_RANGES.some(([lo, hi]) => codePoint >= lo && codePoint <= hi);
}

async function collectFromSource() {
  const files = await walk(SRC);
  const found = new Set();
  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const char of text) {
      if (inMalayalamRange(char.codePointAt(0))) found.add(char);
    }
  }
  return found;
}

async function main() {
  const fromSource = await collectFromSource();

  // The whole block, because geography names arrive from the database at
  // runtime and cannot be discovered by reading source.
  const characters = new Set(SHARED);
  for (const [lo, hi] of MALAYALAM_RANGES) {
    for (let cp = lo; cp <= hi; cp += 1) characters.add(String.fromCodePoint(cp));
  }

  const text = [...characters].join("");
  await mkdir(OUT, { recursive: true });

  /**
   * One weight only.
   *
   * A second weight is another ~39KB, which is a quarter of the page's entire
   * budget. The design carries hierarchy with size, spacing and colour instead —
   * which suits a page whose whole job is to look calm and official rather than
   * loud. Latin text uses the system font stack and costs nothing.
   */
  const weights = [
    { file: "NotoSansMalayalam-Regular.ttf", out: "noto-malayalam-400.woff2" },
  ];

  let total = 0;
  for (const weight of weights) {
    const source = await readFile(join(FONT_SRC, weight.file));
    const subset = await subsetFont(source, text, { targetFormat: "woff2" });
    await writeFile(join(OUT, weight.out), subset);
    const before = (await stat(join(FONT_SRC, weight.file))).size;
    total += subset.length;
    console.log(
      `  ${weight.out.padEnd(28)} ${(before / 1024).toFixed(0)}KB ttf -> ${(subset.length / 1024).toFixed(1)}KB woff2`,
    );
  }

  console.log(`\n  ${fromSource.size} distinct Malayalam characters found in source`);
  console.log(`  full Malayalam block subsetted (database names are not in source)`);
  console.log(`  total shipped: ${(total / 1024).toFixed(1)}KB`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
