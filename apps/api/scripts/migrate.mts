#!/usr/bin/env node
/**
 * Applies every .sql file in drizzle/ in filename order, exactly once.
 *
 * Drizzle's own migrator is not used because half the migrations here are
 * hand-written: policies, functions, triggers and check constraints that
 * drizzle-kit does not model. One runner over one ordered directory keeps the
 * generated and hand-written DDL in a single chain.
 */
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, "..", "drizzle");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      checksum   text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const applied = new Map<string, string>(
    (
      await sql<{ filename: string; checksum: string }[]>`
        SELECT filename, checksum FROM schema_migrations
      `
    ).map((row) => [row.filename, row.checksum]),
  );

  const files = (await readdir(MIGRATIONS))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const filename of files) {
    const body = await readFile(join(MIGRATIONS, filename), "utf8");
    const checksum = createHash("sha256").update(body).digest("hex");
    const previous = applied.get(filename);

    if (previous === checksum) continue;
    if (previous && previous !== checksum) {
      console.error(
        `\n${filename} has changed since it was applied.\n` +
          "Migrations are immutable once run — add a new file instead.",
      );
      process.exit(1);
    }

    process.stdout.write(`applying ${filename} … `);
    // Each file runs in its own transaction, so a failure leaves no partial DDL.
    await sql.begin(async (tx) => {
      // drizzle-kit separates statements with `--> statement-breakpoint`.
      const statements = body
        .split(/-->\s*statement-breakpoint/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await tx.unsafe(statement);
      }
      await tx`
        INSERT INTO schema_migrations (filename, checksum)
        VALUES (${filename}, ${checksum})
      `;
    });
    console.log("ok");
    ran += 1;
  }

  console.log(
    ran === 0 ? "Nothing to apply — schema is current." : `Applied ${ran} migration(s).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
