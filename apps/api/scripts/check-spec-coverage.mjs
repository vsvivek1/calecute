#!/usr/bin/env node
/**
 * Guards against the contract drifting from the implementation.
 *
 * Walks src/app/api/v1 for route files, derives the path and the HTTP methods
 * each one exports, and compares that against openapi/openapi.json. A route
 * that exists but is undocumented is a client that cannot be written; a
 * documented path with no route is a client written against nothing.
 *
 * Run as part of `npm run verify`.
 */
import { readdir, readFile } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROUTES_ROOT = join(HERE, "..", "src", "app", "api", "v1");
const SPEC = join(HERE, "..", "openapi", "openapi.json");

const METHODS = ["get", "post", "put", "patch", "delete"];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name === "route.ts") out.push(full);
  }
  return out;
}

/** app/api/v1/agent/[id]/x/route.ts  ->  /agent/{id}/x */
function specPathFor(file) {
  const rel = relative(ROUTES_ROOT, file).replace(/\/route\.ts$/, "");
  if (rel === "route.ts") return "/";
  return (
    "/" +
    rel
      .split("/")
      .map((segment) =>
        segment.startsWith("[") && segment.endsWith("]")
          ? `{${segment.slice(1, -1)}}`
          : segment,
      )
      .join("/")
  );
}

const files = await walk(ROUTES_ROOT);
const spec = JSON.parse(await readFile(SPEC, "utf8"));

const problems = [];
const implemented = new Map();

for (const file of files) {
  const source = await readFile(file, "utf8");
  const methods = METHODS.filter((m) =>
    new RegExp(`export const ${m.toUpperCase()}\\b`).test(source),
  );
  const path = specPathFor(file);
  implemented.set(path, methods);

  const documented = spec.paths[path];
  if (!documented) {
    problems.push(`UNDOCUMENTED  ${path}  (${methods.join(", ") || "no methods"})`);
    continue;
  }
  for (const method of methods) {
    if (!documented[method]) {
      problems.push(`UNDOCUMENTED  ${method.toUpperCase()} ${path}`);
    }
  }
  for (const method of METHODS) {
    if (documented[method] && !methods.includes(method)) {
      problems.push(`NOT IMPLEMENTED  ${method.toUpperCase()} ${path}`);
    }
  }
}

for (const path of Object.keys(spec.paths)) {
  if (!implemented.has(path)) {
    problems.push(`NO ROUTE FILE  ${path}`);
  }
}

const operationCount = [...implemented.values()].reduce((n, m) => n + m.length, 0);

console.log(
  `Spec coverage: ${files.length} route files, ${operationCount} operations`,
);

if (problems.length === 0) {
  console.log("  every route is documented and every documented path exists");
} else {
  console.log("");
  for (const problem of problems) console.log(`  ${problem}`);
  console.log(`\n${problems.length} problem(s)`);
  process.exitCode = 1;
}
