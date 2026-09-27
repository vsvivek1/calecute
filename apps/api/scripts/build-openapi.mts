#!/usr/bin/env node
/**
 * Writes the spec to openapi/openapi.json at build time.
 *
 * Two reasons it is a file and not only an endpoint: the frontend's type
 * generation runs at build time when the API may not be up, and a committed
 * spec makes contract changes visible in a diff.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSpec } from "../src/openapi/spec.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, "..", "openapi");

const serverUrl =
  process.env.API_PUBLIC_URL?.replace(/\/$/, "") ?? "https://api.calecutech.com/api/v1";

const spec = buildSpec(serverUrl);

await mkdir(OUT_DIR, { recursive: true });
await writeFile(
  join(OUT_DIR, "openapi.json"),
  JSON.stringify(spec, null, 2) + "\n",
  "utf8",
);

const paths = Object.keys(spec.paths as Record<string, unknown>);
const operations = Object.values(spec.paths as Record<string, Record<string, unknown>>)
  .flatMap((p) => Object.keys(p))
  .filter((k) => ["get", "post", "put", "patch", "delete"].includes(k));

console.log(`openapi/openapi.json written`);
console.log(`  OpenAPI ${spec.openapi}`);
console.log(`  ${paths.length} paths, ${operations.length} operations`);
console.log(`  server: ${serverUrl}`);
