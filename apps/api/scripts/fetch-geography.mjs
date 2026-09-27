#!/usr/bin/env node
/**
 * Probes the official Kerala geography sources and reports what can be
 * obtained automatically.
 *
 * Run: npm run geo:fetch --workspace=apps/api
 *
 * Why this script mostly reports rather than downloads
 * ----------------------------------------------------
 * Both authoritative sources gate bulk access behind a CAPTCHA:
 *
 *   - LGD (lgdirectory.gov.in) — "Download Directory" carries a `captchaAnswer`
 *     field and redirects to sessionTimeOutCaptcha.htm without it. The citizen
 *     browse views (globalviewdistrict.do and friends) do too.
 *   - Kerala SEC (trend.sec.kerala.gov.in) — the ward-level AJAX endpoint
 *     returns rls: "RELOAD" and demands a captcha.
 *
 * Defeating a government portal's CAPTCHA is not something this codebase does.
 * So the flow is: a human downloads the exports once, drops them in
 * data/geography/incoming/, and `npm run db:seed` loads them. This script
 * checks the sources are reachable, prints the exact steps, and validates any
 * file already sitting in incoming/.
 */
import { readdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const INCOMING = join(HERE, "..", "data", "geography", "incoming");

const SOURCES = [
  {
    name: "LGD — Local Government Directory (Ministry of Panchayati Raj)",
    url: "https://lgdirectory.gov.in/downloadDirectory.do",
    gated: "CAPTCHA on the download form",
    provides: "districts, block panchayats, gram panchayats, urban local bodies, LGD codes",
    steps: [
      'Open https://lgdirectory.gov.in and choose "Download Directory".',
      'Report "All PRI Local body of India with Covered Village", State = Kerala (32).',
      "Solve the captcha, download the CSV, save as incoming/lgd-pri.csv.",
      'Repeat with "State and District Wise Urban Local Bodies" → incoming/lgd-ulb.csv.',
    ],
  },
  {
    name: "LSGD Kerala — Local Self Government Department",
    url: "https://lsgkerala.gov.in/en/lsgd/localbody-list",
    gated: "no machine-readable export published",
    provides: "Malayalam names for local bodies",
    steps: [
      "Used to fill name_ml where the LGD export only carries English.",
      "If IKM can supply the K-SMART local body master as CSV, prefer that.",
    ],
  },
  {
    name: "Kerala State Election Commission",
    url: "https://sec.kerala.gov.in",
    gated: "CAPTCHA on the ward AJAX endpoint",
    provides: "ward numbers and names per local body (the delimitation notification)",
    steps: [
      "Ward lists come from the delimitation notification per local body.",
      "Save as incoming/wards.csv once obtained.",
    ],
  },
];

/** The file contract the loader expects. Documented here and in docs/GEOGRAPHY.md. */
const CONTRACT = {
  "local-bodies.csv":
    "district_name_en,district_lgd_code,block_name_en,block_name_ml,block_lgd_code,type,name_en,name_ml,lgd_code",
  "wards.csv":
    "local_body_lgd_code,local_body_name_en,district_name_en,ward_number,ward_name_en,ward_name_ml,ward_lgd_code",
};

async function reachable(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return `HTTP ${response.status}`;
  } catch (error) {
    return `unreachable (${error.name})`;
  }
}

async function listIncoming() {
  try {
    const names = await readdir(INCOMING);
    const out = [];
    for (const name of names) {
      if (name.startsWith(".")) continue;
      const info = await stat(join(INCOMING, name));
      out.push({ name, bytes: info.size });
    }
    return out;
  } catch {
    return null;
  }
}

const main = async () => {
  console.log("Kerala geography — source check\n");

  for (const source of SOURCES) {
    const status = await reachable(source.url);
    console.log(`  ${source.name}`);
    console.log(`    url      ${source.url}`);
    console.log(`    status   ${status}`);
    console.log(`    gated by ${source.gated}`);
    console.log(`    provides ${source.provides}`);
    for (const step of source.steps) console.log(`      - ${step}`);
    console.log("");
  }

  console.log("Expected files in data/geography/incoming/:\n");
  for (const [file, header] of Object.entries(CONTRACT)) {
    console.log(`  ${file}`);
    console.log(`    header: ${header}`);
  }
  console.log("");

  const present = await listIncoming();
  if (present === null) {
    console.log("incoming/ does not exist yet — nothing to load.");
  } else if (present.length === 0) {
    console.log("incoming/ is empty — nothing to load.");
  } else {
    console.log("Found:");
    for (const file of present) {
      console.log(`  ${file.name}  (${file.bytes} bytes)`);
    }
  }

  console.log(
    "\nWhen the files are in place run: npm run db:seed --workspace=apps/api",
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
