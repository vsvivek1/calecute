#!/usr/bin/env node
/**
 * Converts the LGD Excel exports into the CSV the seed loader reads.
 *
 *   npm run geo:convert --workspace=apps/api
 *
 * Inputs, both downloaded by hand from lgdirectory.gov.in (the bulk download is
 * CAPTCHA-gated, so this cannot be automated — see scripts/fetch-geography.mjs):
 *
 *   Pri_Lb_Specific_State_*.xlsx
 *     Every PRI local body in Kerala with its LGD code, its parent's code, and
 *     crucially the name in Malayalam as well as English.
 *
 *   All_Pricovered_Villages_kerala_*.xlsx
 *     The same bodies joined to villages, which is the only place the export
 *     gives the REVENUE district. That matters: LGD's "district panchayat" is a
 *     PRI tier, not the revenue district the programme is organised by. They
 *     happen to correspond one-to-one in Kerala, but relying on that
 *     coincidence would be wrong, so the revenue district code is taken from
 *     the file that actually states it.
 *
 * Output: data/geography/incoming/local-bodies.csv
 *
 * Nothing is invented here. A body the join cannot resolve is reported and
 * skipped, never guessed.
 */
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readSheet, asCode } from "./lib/xlsx.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = join(HERE, "..", "data", "geography", "raw");
const INCOMING = join(HERE, "..", "data", "geography", "incoming");

/**
 * Malayalam chillu letters have two encodings: the modern atomic characters
 * (U+0D7A..U+0D7F) and the older consonant + virama + ZWJ sequences. LGD uses
 * the old form. Both must find the same row when someone searches, so they are
 * normalised on the way in — otherwise "കണ്ണൂർ" typed on a phone keyboard would
 * not match "കണ്ണൂര്‍" as stored.
 */
const CHILLU = [
  [/ണ്‍/g, "ൺ"], // ണ് + ZWJ -> ൺ
  [/ന്‍/g, "ൻ"], // ന് + ZWJ -> ൻ
  [/ര്‍/g, "ർ"], // ര് + ZWJ -> ർ
  [/ല്‍/g, "ൽ"], // ല് + ZWJ -> ൽ
  [/ള്‍/g, "ൾ"], // ള് + ZWJ -> ൾ
  [/ക്‍/g, "ൿ"], // ക് + ZWJ -> ൿ
];

function normaliseMalayalam(value) {
  let out = (value ?? "").normalize("NFC").trim();
  for (const [pattern, replacement] of CHILLU) out = out.replace(pattern, replacement);
  return out;
}

function clean(value) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

async function findFile(prefix) {
  const names = await readdir(RAW);
  const match = names
    .filter((n) => n.startsWith(prefix) && n.endsWith(".xlsx"))
    .sort()
    .pop();
  if (!match) {
    throw new Error(
      `No file starting "${prefix}" in data/geography/raw/. Run: npm run geo:fetch`,
    );
  }
  return join(RAW, match);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function main() {
  const lbPath = await findFile("Pri_Lb_Specific_State");
  const villagePath = await findFile("All_Pricovered_Villages_kerala");

  /* ------------------------------------------------- local bodies + names */
  const lbRows = readSheet(lbPath).slice(2); // title row, then header row
  const bodies = new Map();

  for (const row of lbRows) {
    const code = asCode(row[3]);
    if (!code) continue;
    bodies.set(code, {
      code,
      type: clean(row[2]).toUpperCase(),
      nameEn: clean(row[5]),
      nameMl: normaliseMalayalam(row[6]),
      parent: asCode(row[7]),
    });
  }

  /* --------------------------------------- gram panchayat -> revenue district */
  const villageRows = readSheet(villagePath).slice(1);
  const districtOf = new Map(); // gram panchayat code -> { code, name }
  const districts = new Map(); // revenue district code -> name

  for (const row of villageRows) {
    const gpCode = asCode(row[7]);
    const districtCode = asCode(row[13]);
    const districtName = clean(row[14]);
    if (!gpCode || !districtCode) continue;
    districtOf.set(gpCode, { code: districtCode, name: districtName });
    districts.set(districtCode, districtName);
  }

  /* ------------------------------------------------------------- assemble */
  const header = [
    "district_name_en",
    "district_lgd_code",
    "block_name_en",
    "block_name_ml",
    "block_lgd_code",
    "type",
    "name_en",
    "name_ml",
    "lgd_code",
  ];

  const out = [header.join(",")];
  const skipped = [];
  let written = 0;

  for (const body of bodies.values()) {
    if (body.type !== "GRAMA PANCHAYAT") continue;

    const block = body.parent ? bodies.get(body.parent) : null;
    if (!block || block.type !== "BLOCK PANCHAYAT") {
      skipped.push(`${body.nameEn} (${body.code}): no block panchayat parent`);
      continue;
    }

    const district = districtOf.get(body.code);
    if (!district) {
      skipped.push(`${body.nameEn} (${body.code}): no revenue district in the village export`);
      continue;
    }

    out.push(
      [
        district.name,
        district.code,
        block.nameEn,
        block.nameMl,
        block.code,
        "GRAM_PANCHAYAT",
        body.nameEn,
        body.nameMl,
        body.code,
      ]
        .map(csvCell)
        .join(","),
    );
    written += 1;
  }

  await mkdir(INCOMING, { recursive: true });
  await writeFile(join(INCOMING, "local-bodies.csv"), out.join("\n") + "\n", "utf8");

  /* --------------------------------------------------------------- report */
  const counts = { DISTRICT: 0, BLOCK: 0, GRAM: 0 };
  for (const b of bodies.values()) {
    if (b.type === "DISTRICT PANCHAYAT") counts.DISTRICT += 1;
    if (b.type === "BLOCK PANCHAYAT") counts.BLOCK += 1;
    if (b.type === "GRAMA PANCHAYAT") counts.GRAM += 1;
  }

  console.log("LGD conversion\n");
  console.log(`  source: ${lbPath.split("/").pop()}`);
  console.log(`          ${villagePath.split("/").pop()}\n`);
  console.log(`  district panchayats in export: ${counts.DISTRICT}`);
  console.log(`  block panchayats in export:    ${counts.BLOCK}`);
  console.log(`  grama panchayats in export:    ${counts.GRAM}`);
  console.log(`  revenue districts resolved:    ${districts.size}`);
  console.log(`\n  written to incoming/local-bodies.csv: ${written}`);

  if (skipped.length > 0) {
    console.log(`\n  skipped ${skipped.length}:`);
    for (const note of skipped.slice(0, 15)) console.log(`    ${note}`);
    if (skipped.length > 15) console.log(`    … and ${skipped.length - 15} more`);
  }

  console.log(
    "\n  NOT in this export: municipalities and corporations (the PRI export",
  );
  console.log(
    "  covers panchayats only), and wards. Both are still outstanding — see",
  );
  console.log("  docs/GEOGRAPHY.md.");
  console.log("\n  Next: npm run db:seed --workspace=apps/api");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
