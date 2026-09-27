#!/usr/bin/env node
/**
 * Generates src/lib/api/schema.d.ts from the API's OpenAPI document.
 *
 * The contract flows one way: apps/api owns the spec, and the frontend derives
 * its types from it. There is no shared package and no import across the app
 * boundary — the only thing that crosses is a generated .d.ts, which carries no
 * runtime code and cannot pull server modules into the browser bundle.
 *
 * Source order: API_SPEC_URL if set (generate against the deployment you will
 * actually call), otherwise the committed file.
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import openapiTS, { astToString } from "openapi-typescript";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "src", "lib", "api");
const LOCAL_SPEC = join(HERE, "..", "..", "api", "openapi", "openapi.json");

const source = process.env.API_SPEC_URL ?? LOCAL_SPEC;

const input = process.env.API_SPEC_URL
  ? new URL(source)
  : JSON.parse(await readFile(LOCAL_SPEC, "utf8"));

const ast = await openapiTS(input, {
  alphabetize: true,
  emptyObjectsUnknown: true,
});

const banner = `/**
 * GENERATED FILE — do not edit.
 *
 * Produced from the API's OpenAPI 3.1 document by scripts/generate-api-types.mjs.
 * Regenerate with: npm run api:types --workspace=apps/web
 *
 * Source: ${process.env.API_SPEC_URL ?? "apps/api/openapi/openapi.json"}
 */

`;

await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, "schema.d.ts"), banner + astToString(ast), "utf8");

console.log("src/lib/api/schema.d.ts written from", source);
