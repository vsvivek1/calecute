/**
 * API keys for product systems.
 *
 * A key is the only credential a product app holds for this API, so the
 * design is the usual one: random, prefixed so a leaked key is recognisable
 * in a log or a repository scan, and stored only as a hash so the database
 * cannot give one back.
 *
 *   ck_live_<32 chars>   client key. Ships inside a mobile app or a browser
 *                        bundle, so it is treated as public knowledge: it may
 *                        register members, claim attributions and log clicks,
 *                        and nothing it can do moves money.
 *   sk_live_<32 chars>   server key. Held by the product's backend only. May
 *                        additionally record payments.
 *
 * Kept free of path aliases so scripts/mint-api-key.mts can import it under
 * plain Node.
 */
import { createHash, randomBytes } from "node:crypto";

export type ApiKeyKind = "client" | "server";

export const API_KEY_KINDS: readonly ApiKeyKind[] = ["client", "server"];

/** Crockford base32: no I, L, O or U, so a key survives being read aloud. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

const PREFIX: Record<ApiKeyKind, string> = {
  client: "ck_live_",
  server: "sk_live_",
};

export function isApiKeyKind(value: string): value is ApiKeyKind {
  return (API_KEY_KINDS as readonly string[]).includes(value);
}

/** 32 base32 characters: 160 bits, from the CSPRNG. */
export function randomToken(length = 32): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) out += ALPHABET[bytes[i] % 32];
  return out;
}

/** The plaintext and its hash. The plaintext is returned once and never stored. */
export function mintApiKey(kind: ApiKeyKind): { plaintext: string; hash: string } {
  const plaintext = `${PREFIX[kind]}${randomToken()}`;
  return { plaintext, hash: hashApiKey(plaintext) };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/** The kind a plaintext claims to be, from its prefix. Null if it is not a key. */
export function kindOfApiKey(plaintext: string): ApiKeyKind | null {
  if (plaintext.startsWith(PREFIX.client)) return "client";
  if (plaintext.startsWith(PREFIX.server)) return "server";
  return null;
}
