#!/usr/bin/env node
/**
 * Mints an API key for a product system, from the command line.
 *
 *   node --env-file-if-exists=.env.local scripts/mint-api-key.mts <product-slug> <client|server> "<label>"
 *
 * The plaintext is printed once and never stored; only its SHA-256 is. Runs
 * as the connecting (owner) role against DATABASE_URL, the same way the seed
 * does, so it works before any SUPER_ADMIN has signed in. The equivalent over
 * HTTP is POST /api/v1/admin/products/{id}/api-keys.
 */
import postgres from "postgres";
import { isApiKeyKind, mintApiKey } from "../src/lib/apikeys.ts";

const [slug, kind, ...labelParts] = process.argv.slice(2);
const label = labelParts.join(" ").trim();

if (!slug || !kind || !label || !isApiKeyKind(kind)) {
  console.error(
    'Usage: mint-api-key.mts <product-slug> <client|server> "<label>"\n' +
      "  client  ships inside an app: members, attribution claims, clicks\n" +
      "  server  held by the product backend: additionally records payments",
  );
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const [product] = await sql<{ id: number; name_en: string }[]>`
    SELECT id, name_en FROM products WHERE slug = ${slug}
  `;
  if (!product) {
    console.error(`No product with slug "${slug}". Run npm run db:seed first.`);
    process.exit(1);
  }

  const { plaintext, hash } = mintApiKey(kind);
  const [row] = await sql<{ id: number }[]>`
    INSERT INTO product_api_keys (product_id, kind, key_hash, label)
    VALUES (${product.id}, ${kind}, ${hash}, ${label})
    RETURNING id
  `;

  console.log(`${kind} key #${row.id} for ${product.name_en} (${slug}) — "${label}"`);
  console.log("");
  console.log(`  ${plaintext}`);
  console.log("");
  console.log("Copy it now. It is not stored and cannot be shown again.");
  console.log(`Send it as the X-Api-Key header. Revoke with DELETE /api/v1/admin/products/${product.id}/api-keys/${row.id}.`);
} finally {
  await sql.end();
}
