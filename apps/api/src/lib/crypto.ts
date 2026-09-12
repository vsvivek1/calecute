/**
 * Encryption for the two fields that genuinely need it: PAN and bank account
 * number.
 *
 * Rules this module exists to enforce:
 *  - Ciphertext never leaves the database layer. Nothing returns a decrypted
 *    PAN to any client, including an admin one.
 *  - Duplicate detection uses a keyed fingerprint, so "is this PAN already
 *    registered" is answered without decrypting anything.
 *  - The only thing ever displayed is the mask, built from the last four
 *    characters: XXXXX1234F.
 */
import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function keyFrom(raw: string): Buffer {
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      "Encryption key must decode to exactly 32 bytes. Generate one with: openssl rand -base64 32",
    );
  }
  return key;
}

/** `v1.<iv>.<ciphertext>.<tag>`, all base64url. The prefix allows rotation. */
export function encryptPii(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, keyFrom(env().PII_ENCRYPTION_KEY), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    tag.toString("base64url"),
  ].join(".");
}

/**
 * Only ever called by an operator-run script (for example, generating the
 * bank transfer file at payout time). No request path calls this.
 */
export function decryptPii(encoded: string): string {
  const [version, iv, ciphertext, tag] = encoded.split(".");
  if (version !== "v1" || !iv || !ciphertext || !tag) {
    throw new Error("Unrecognised ciphertext format");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    keyFrom(env().PII_ENCRYPTION_KEY),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

/**
 * Deterministic, keyed, one-way. Two agents who submit the same PAN produce
 * the same fingerprint, which trips the unique index. Without the key the
 * fingerprint cannot be brute-forced back to a PAN — the PAN space is small
 * enough that an unkeyed hash would be trivially reversible.
 */
export function fingerprintPii(value: string): string {
  return createHmac("sha256", keyFrom(env().PII_FINGERPRINT_KEY))
    .update(value.toUpperCase())
    .digest("base64url");
}

/** XXXXX1234F — the only PAN representation any UI is allowed to render. */
export function maskPan(last4: string | null): string | null {
  if (!last4) return null;
  return `XXXXX${last4}`;
}

export function lastFourOfPan(pan: string): string {
  // A PAN is AAAAA1111A; the meaningful tail is the four digits plus check letter.
  return pan.slice(5);
}

export function maskAccountNumber(last4: string | null): string | null {
  if (!last4) return null;
  return `••••${last4}`;
}
