/**
 * Client address handling.
 *
 * Full IP addresses are personal data under the DPDP Act, so nothing in this
 * codebase stores one. Rate limiting and abuse detection work on a truncated
 * prefix — /24 for IPv4, /48 for IPv6 — which is specific enough to catch one
 * person farming accounts and coarse enough not to identify a household.
 */
import type { NextRequest } from "next/server";
import { createHash } from "node:crypto";

export function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

export function ipPrefix(request: NextRequest): string | null {
  const ip = clientIp(request);
  if (!ip) return null;
  if (ip.includes(":")) {
    // IPv6: keep the first three hextets (/48).
    return ip.split(":").slice(0, 3).join(":") + "::/48";
  }
  const octets = ip.split(".");
  if (octets.length !== 4) return null;
  return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
}

/**
 * A device fingerprint supplied by the client, hashed before storage.
 *
 * The raw value never lands in the database. It is a weak signal — trivially
 * spoofed by anyone determined — used only to surface "several signups from one
 * device" to a human reviewer, never to block automatically.
 */
export function hashFingerprint(raw: string | null): string | null {
  if (!raw) return null;
  return createHash("sha256").update(raw).digest("base64url").slice(0, 32);
}
