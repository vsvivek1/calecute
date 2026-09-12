#!/usr/bin/env node
/**
 * Seeds reference data and prints the geography completeness report.
 *
 * Idempotent: safe to run on every deploy. It inserts what is missing and
 * leaves everything else alone. It never deletes.
 *
 * What is seeded from the repository:
 *   - Kerala and its 14 districts (data/geography/districts.json)
 *   - The initial terms version
 *   - The two SUPER_ADMIN accounts named in the brief
 *
 * What is loaded from an official export, when present in
 * data/geography/incoming/:
 *   - block panchayats, gram panchayats, municipalities, corporations
 *   - wards
 *
 * Nothing below district level is ever generated. A missing file produces a
 * gap in the report, not a plausible-looking row.
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "..", "data", "geography");
const INCOMING = join(DATA, "incoming");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

/** The accounts the brief names. Seeded here, never referenced in app code. */
const SUPER_ADMINS = [
  { email: "info@calecutech.com", name: "Calecute Technologies" },
  { email: "vs.vivek1@gmail.com", name: "Vivek V S" },
];

const INITIAL_TERMS_VERSION = "2026-09-01";

type Csv = Record<string, string>[];

/** Minimal RFC 4180 reader: handles quoted fields, embedded commas, CRLF. */
function parseCsv(text: string): Csv {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (!header) return [];
  return body.map((cells) =>
    Object.fromEntries(
      header.map((key, index) => [key.trim(), (cells[index] ?? "").trim()]),
    ),
  );
}

async function readCsvIfPresent(name: string): Promise<Csv | null> {
  try {
    return parseCsv(await readFile(join(INCOMING, name), "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function seedStateAndDistricts() {
  const file = JSON.parse(
    await readFile(join(DATA, "districts.json"), "utf8"),
  ) as {
    state: { nameEn: string; nameMl: string; lgdCode: number | null };
    districts: Array<{
      nameEn: string;
      nameMl: string;
      codeSlug: string;
      lgdCode: number | null;
    }>;
  };

  const [state] = await sql<{ id: number }[]>`
    INSERT INTO states (name_en, name_ml, lgd_code)
    VALUES (${file.state.nameEn}, ${file.state.nameMl}, ${file.state.lgdCode})
    ON CONFLICT (lgd_code) DO UPDATE SET name_ml = EXCLUDED.name_ml
    RETURNING id
  `;

  for (const district of file.districts) {
    await sql`
      INSERT INTO districts (state_id, name_en, name_ml, code_slug, lgd_code)
      VALUES (${state.id}, ${district.nameEn}, ${district.nameMl}, ${district.codeSlug}, ${district.lgdCode})
      ON CONFLICT (code_slug) DO UPDATE
        SET name_ml = EXCLUDED.name_ml,
            name_en = EXCLUDED.name_en
    `;
  }

  // Every district needs a counter before its first agent code is issued.
  await sql`
    INSERT INTO agent_code_sequences (district_id, next_seq)
    SELECT id, 1 FROM districts
    ON CONFLICT (district_id) DO NOTHING
  `;

  return state.id;
}

async function seedTerms() {
  await sql`
    INSERT INTO terms_versions (version, effective_from, url)
    VALUES (
      ${INITIAL_TERMS_VERSION},
      ${new Date(`${INITIAL_TERMS_VERSION}T00:00:00Z`)},
      '/agents/terms'
    )
    ON CONFLICT (version) DO NOTHING
  `;
}

async function seedSuperAdmins() {
  for (const admin of SUPER_ADMINS) {
    // google_sub is filled in on first sign-in; a placeholder keeps the NOT
    // NULL constraint satisfied and is replaced by the real subject then.
    await sql`
      INSERT INTO users (google_sub, email, name, role, email_verified)
      VALUES (${`pending:${admin.email}`}, ${admin.email}, ${admin.name}, 'SUPER_ADMIN', false)
      ON CONFLICT (google_sub) DO UPDATE SET role = 'SUPER_ADMIN'
    `;
  }
}

async function loadLocalBodies(): Promise<{ loaded: number; skipped: string[] }> {
  const rows = await readCsvIfPresent("local-bodies.csv");
  if (!rows) return { loaded: 0, skipped: ["local-bodies.csv not present"] };

  const skipped: string[] = [];
  let loaded = 0;

  for (const row of rows) {
    const districtName = row.district_name_en;
    const [district] = await sql<{ id: number }[]>`
      SELECT id FROM districts WHERE lower(name_en) = lower(${districtName})
    `;
    if (!district) {
      skipped.push(`unknown district "${districtName}" for "${row.name_en}"`);
      continue;
    }

    const type = row.type?.toUpperCase();
    if (!["GRAM_PANCHAYAT", "MUNICIPALITY", "CORPORATION"].includes(type)) {
      skipped.push(`unknown type "${row.type}" for "${row.name_en}"`);
      continue;
    }

    let blockId: number | null = null;
    if (type === "GRAM_PANCHAYAT") {
      if (!row.block_name_en) {
        skipped.push(`gram panchayat "${row.name_en}" has no block`);
        continue;
      }
      const [block] = await sql<{ id: number }[]>`
        INSERT INTO block_panchayats (district_id, name_en, name_ml, lgd_code)
        VALUES (
          ${district.id}, ${row.block_name_en},
          ${row.block_name_ml || row.block_name_en},
          ${row.block_lgd_code ? Number(row.block_lgd_code) : null}
        )
        ON CONFLICT (lgd_code) DO UPDATE SET name_ml = EXCLUDED.name_ml
        RETURNING id
      `;
      blockId =
        block?.id ??
        (
          await sql<{ id: number }[]>`
            SELECT id FROM block_panchayats
             WHERE district_id = ${district.id}
               AND lower(name_en) = lower(${row.block_name_en})
          `
        )[0]?.id ??
        null;
      if (!blockId) {
        skipped.push(`could not resolve block for "${row.name_en}"`);
        continue;
      }
    }

    await sql`
      INSERT INTO local_bodies
        (district_id, block_panchayat_id, type, name_en, name_ml, lgd_code)
      VALUES (
        ${district.id}, ${blockId}, ${type}::local_body_type,
        ${row.name_en}, ${row.name_ml || row.name_en},
        ${row.lgd_code ? Number(row.lgd_code) : null}
      )
      ON CONFLICT (lgd_code) DO UPDATE
        SET name_ml = EXCLUDED.name_ml, name_en = EXCLUDED.name_en
    `;
    loaded += 1;
  }

  return { loaded, skipped };
}

async function loadWards(): Promise<{ loaded: number; skipped: string[] }> {
  const rows = await readCsvIfPresent("wards.csv");
  if (!rows) return { loaded: 0, skipped: ["wards.csv not present"] };

  const skipped: string[] = [];
  let loaded = 0;

  for (const row of rows) {
    const lgdCode = row.local_body_lgd_code ? Number(row.local_body_lgd_code) : null;
    const [body] = await sql<{ id: number }[]>`
      SELECT lb.id FROM local_bodies lb
       WHERE (${lgdCode}::int IS NOT NULL AND lb.lgd_code = ${lgdCode})
          OR (${lgdCode}::int IS NULL
              AND lower(lb.name_en) = lower(${row.local_body_name_en ?? ""}))
       LIMIT 1
    `;
    if (!body) {
      skipped.push(`unknown local body "${row.local_body_name_en}"`);
      continue;
    }
    const number = Number(row.ward_number);
    if (!Number.isInteger(number) || number < 1) {
      skipped.push(`bad ward number "${row.ward_number}"`);
      continue;
    }
    await sql`
      INSERT INTO wards (local_body_id, number, name_en, name_ml, lgd_code, status)
      VALUES (
        ${body.id}, ${number},
        ${row.ward_name_en || null}, ${row.ward_name_ml || null},
        ${row.ward_lgd_code ? Number(row.ward_lgd_code) : null},
        ${row.ward_name_en || row.ward_name_ml ? "COMPLETE" : "PENDING"}::data_completeness
      )
      ON CONFLICT (local_body_id, number) DO UPDATE
        SET name_en = EXCLUDED.name_en,
            name_ml = EXCLUDED.name_ml,
            status = EXCLUDED.status
    `;
    loaded += 1;
  }

  // A local body is only COMPLETE if every ward it has carries a name.
  await sql`
    UPDATE local_bodies lb SET ward_data = sub.status
      FROM (
        SELECT w.local_body_id,
               CASE
                 WHEN count(*) FILTER (WHERE w.status = 'COMPLETE') = 0 THEN 'PENDING'
                 WHEN count(*) FILTER (WHERE w.status <> 'COMPLETE') > 0 THEN 'PARTIAL'
                 ELSE 'COMPLETE'
               END::data_completeness AS status
          FROM wards w GROUP BY w.local_body_id
      ) sub
     WHERE lb.id = sub.local_body_id
  `;

  await sql`
    UPDATE districts d SET ward_data = sub.status
      FROM (
        SELECT lb.district_id,
               CASE
                 WHEN count(*) FILTER (WHERE lb.ward_data = 'COMPLETE') = 0 THEN 'PENDING'
                 WHEN count(*) FILTER (WHERE lb.ward_data <> 'COMPLETE') > 0 THEN 'PARTIAL'
                 ELSE 'COMPLETE'
               END::data_completeness AS status
          FROM local_bodies lb GROUP BY lb.district_id
      ) sub
     WHERE d.id = sub.district_id
  `;

  return { loaded, skipped };
}

async function completenessReport() {
  const official = JSON.parse(
    await readFile(join(DATA, "official-totals.json"), "utf8"),
  ) as {
    verified: string | null;
    source: string | null;
    totals: Record<string, number | null>;
  };

  const [counts] = await sql<
    {
      districts: number;
      blocks: number;
      gram: number;
      municipalities: number;
      corporations: number;
      wards: number;
      wards_pending: number;
    }[]
  >`
    SELECT
      (SELECT count(*) FROM districts)::int AS districts,
      (SELECT count(*) FROM block_panchayats)::int AS blocks,
      (SELECT count(*) FROM local_bodies WHERE type = 'GRAM_PANCHAYAT')::int AS gram,
      (SELECT count(*) FROM local_bodies WHERE type = 'MUNICIPALITY')::int AS municipalities,
      (SELECT count(*) FROM local_bodies WHERE type = 'CORPORATION')::int AS corporations,
      (SELECT count(*) FROM wards)::int AS wards,
      (SELECT count(*) FROM wards WHERE status <> 'COMPLETE')::int AS wards_pending
  `;

  const line = (
    label: string,
    seeded: number,
    expected: number | null | undefined,
  ) => {
    const target = expected ?? null;
    const status =
      target === null ? "no reference" : seeded === target ? "complete" : "INCOMPLETE";
    const of = target === null ? "?" : String(target);
    console.log(
      `  ${label.padEnd(22)} ${String(seeded).padStart(5)} / ${of.padStart(5)}   ${status}`,
    );
  };

  console.log("\nGeography completeness\n");
  console.log(
    `  reference totals verified: ${official.verified ?? "NOT VERIFIED — see data/geography/official-totals.json"}`,
  );
  console.log(`  reference source:          ${official.source ?? "none recorded"}\n`);
  console.log("  tier                   seeded / official   status");
  console.log("  " + "-".repeat(52));
  line("districts", counts.districts, official.totals.districts);
  line("block panchayats", counts.blocks, official.totals.blockPanchayats);
  line("gram panchayats", counts.gram, official.totals.gramPanchayats);
  line("municipalities", counts.municipalities, official.totals.municipalities);
  line("corporations", counts.corporations, official.totals.corporations);
  line("wards", counts.wards, official.totals.wards);

  if (counts.wards_pending > 0) {
    console.log(
      `\n  ${counts.wards_pending} ward(s) are marked PENDING — the row exists but no official name was loaded.`,
    );
  }

  const districtsWithoutBodies = await sql<{ name_en: string }[]>`
    SELECT d.name_en FROM districts d
     WHERE NOT EXISTS (SELECT 1 FROM local_bodies lb WHERE lb.district_id = d.id)
     ORDER BY d.name_en
  `;
  if (districtsWithoutBodies.length > 0) {
    console.log(
      `\n  Districts with no local bodies loaded (${districtsWithoutBodies.length}):`,
    );
    console.log(
      "    " + districtsWithoutBodies.map((d) => d.name_en).join(", "),
    );
    console.log(
      "\n  Signups cannot be accepted in these districts: the panchayat picker",
    );
    console.log(
      "  will be empty and the API rejects any local body id that is not seeded.",
    );
  }
}

async function main() {
  console.log("Seeding reference data …\n");
  await seedStateAndDistricts();
  console.log("  state + 14 districts   ok");
  await seedTerms();
  console.log(`  terms version ${INITIAL_TERMS_VERSION}   ok`);
  await seedSuperAdmins();
  console.log(`  ${SUPER_ADMINS.length} super admin accounts  ok`);

  const bodies = await loadLocalBodies();
  console.log(`\n  local bodies loaded:   ${bodies.loaded}`);
  for (const note of bodies.skipped.slice(0, 20)) console.log(`    skipped: ${note}`);
  if (bodies.skipped.length > 20) {
    console.log(`    … and ${bodies.skipped.length - 20} more`);
  }

  const wards = await loadWards();
  console.log(`  wards loaded:          ${wards.loaded}`);
  for (const note of wards.skipped.slice(0, 20)) console.log(`    skipped: ${note}`);
  if (wards.skipped.length > 20) {
    console.log(`    … and ${wards.skipped.length - 20} more`);
  }

  await completenessReport();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
