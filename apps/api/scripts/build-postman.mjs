#!/usr/bin/env node
/**
 * Generates a Postman collection from the OpenAPI document.
 *
 *   npm run postman --workspace=apps/api
 *
 * Generated rather than hand-maintained, for the same reason the frontend's
 * types are: a collection someone curates by hand drifts from the API within a
 * fortnight, and a drifted collection is worse than none because people trust
 * it. This one covers every operation by construction — if a route exists in
 * the spec it is in here, and check-spec-coverage.mjs already guarantees the
 * spec matches the routes.
 *
 * Auth is wired as a collection-level bearer token reading {{accessToken}}, and
 * the sign-in request has a test script that captures the token into the
 * environment, so importing this and running "auth → google" once makes every
 * other request work.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC = join(HERE, "..", "openapi", "openapi.json");
const OUT_DIR = join(HERE, "..", "postman");

const METHODS = ["get", "post", "put", "patch", "delete"];

/** Turn /agents/{id}/approve into a Postman path array with :id segments. */
function pathParts(path) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith("{") && segment.endsWith("}")
        ? `:${segment.slice(1, -1)}`
        : segment,
    );
}

/** A usable example body from a JSON Schema, so requests are runnable. */
function exampleFor(schema, components, depth = 0) {
  if (!schema || depth > 6) return null;

  if (schema.$ref) {
    const name = schema.$ref.split("/").pop();
    return exampleFor(components[name], components, depth + 1);
  }
  if (schema.examples?.length) return schema.examples[0];
  if (schema.default !== undefined) return schema.default;
  if (schema.const !== undefined) return schema.const;
  if (schema.enum?.length) return schema.enum[0];

  // anyOf/oneOf: take the first branch, which is the common shape.
  const branch = schema.anyOf ?? schema.oneOf;
  if (branch?.length) return exampleFor(branch[0], components, depth + 1);

  const type = Array.isArray(schema.type)
    ? schema.type.find((t) => t !== "null")
    : schema.type;

  if (type === "object" || schema.properties) {
    const out = {};
    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      out[key] = exampleFor(value, components, depth + 1);
    }
    return out;
  }
  if (type === "array") {
    const item = exampleFor(schema.items, components, depth + 1);
    return item === null ? [] : [item];
  }
  if (type === "integer" || type === "number") return 0;
  if (type === "boolean") return true;
  if (type === "string") {
    if (schema.format === "email") return "someone@example.com";
    if (schema.format === "date-time") return new Date().toISOString();
    return "";
  }
  return null;
}

async function main() {
  const spec = JSON.parse(await readFile(SPEC, "utf8"));
  const components = spec.components?.schemas ?? {};

  // One folder per tag, in the order the spec declares them — which is the
  // grouping the brief asked for: auth, me, geography, signup, agent, payouts,
  // products, admin reports, admin actions, attribution.
  const folders = new Map();
  for (const tag of spec.tags ?? []) {
    folders.set(tag.name, {
      name: tag.name,
      description: tag.description,
      item: [],
    });
  }

  let operationCount = 0;

  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const method of METHODS) {
      const operation = methods[method];
      if (!operation) continue;
      operationCount += 1;

      const tag = operation.tags?.[0] ?? "other";
      if (!folders.has(tag)) folders.set(tag, { name: tag, item: [] });

      const query = (operation.parameters ?? [])
        .filter((p) => p.in === "query")
        .map((p) => ({
          key: p.name,
          value: p.schema?.default !== undefined ? String(p.schema.default) : "",
          description: p.description,
          // Optional parameters are present but disabled, so the request is
          // runnable as-is and the options are discoverable.
          disabled: !p.required,
        }));

      const headers = [{ key: "Accept", value: "application/json" }];
      for (const p of operation.parameters ?? []) {
        if (p.in !== "header") continue;
        headers.push({
          key: p.name,
          value: p.name === "Idempotency-Key" ? "{{$guid}}" : "",
          description: p.description,
        });
      }

      const bodySchema =
        operation.requestBody?.content?.["application/json"]?.schema;
      const body = bodySchema
        ? {
            mode: "raw",
            raw: JSON.stringify(exampleFor(bodySchema, components) ?? {}, null, 2),
            options: { raw: { language: "json" } },
          }
        : undefined;

      if (body) headers.push({ key: "Content-Type", value: "application/json" });

      const request = {
        name: operation.summary ?? `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: headers,
          url: {
            raw: `{{baseUrl}}${path}${query.length ? "?" + query.map((q) => `${q.key}=${q.value}`).join("&") : ""}`,
            host: ["{{baseUrl}}"],
            path: pathParts(path),
            query,
          },
          description: operation.description,
          // Endpoints the spec marks as public opt out of the bearer token.
          ...(operation.security?.length === 0 ? { auth: { type: "noauth" } } : {}),
        },
        response: [],
      };

      // Capture the token from sign-in so the rest of the collection works.
      if (path === "/auth/google" && method === "post") {
        request.event = [
          {
            listen: "test",
            script: {
              type: "text/javascript",
              exec: [
                "// Stores the tokens so every other request in this collection works.",
                "const body = pm.response.json();",
                "if (body.accessToken) {",
                "  pm.collectionVariables.set('accessToken', body.accessToken);",
                "  pm.collectionVariables.set('refreshToken', body.refreshToken);",
                "  console.log('Signed in as', body.user && body.user.email, '-', body.user && body.user.role);",
                "}",
              ],
            },
          },
        ];
      }

      folders.get(tag).item.push(request);
    }
  }

  const collection = {
    info: {
      name: "Calecute — Commission Agent Programme API",
      description: [
        spec.info.description,
        "",
        "## Using this collection",
        "",
        "1. Set `baseUrl` (defaults to local development).",
        "2. Run **auth → Exchange a Google credential**. Its test script stores",
        "   the access token, and every other request picks it up automatically.",
        "3. Requests that write money need an `Idempotency-Key`; those already",
        "   carry `{{$guid}}`, which Postman regenerates per send. To test a",
        "   replay, paste a fixed value instead.",
        "",
        "Optional query parameters are included but disabled, so the options are",
        "visible without breaking the default request.",
        "",
        "GENERATED FILE — regenerate with `npm run postman --workspace=apps/api`.",
      ].join("\n"),
      schema:
        "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    auth: {
      type: "bearer",
      bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }],
    },
    variable: [
      {
        key: "baseUrl",
        value: "http://localhost:3001/api/v1",
        description: "The API root, including /api/v1.",
      },
      { key: "accessToken", value: "", description: "Set by the sign-in request." },
      { key: "refreshToken", value: "" },
    ],
    item: [...folders.values()].filter((folder) => folder.item.length > 0),
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    join(OUT_DIR, "calecute-agents.postman_collection.json"),
    JSON.stringify(collection, null, 2) + "\n",
    "utf8",
  );

  console.log("postman/calecute-agents.postman_collection.json");
  console.log(`  ${collection.item.length} folders, ${operationCount} requests`);
  for (const folder of collection.item) {
    console.log(`    ${folder.name.padEnd(16)} ${folder.item.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
