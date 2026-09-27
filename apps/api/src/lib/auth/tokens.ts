/**
 * Our own tokens.
 *
 * Access tokens are stateless and short-lived: every endpoint authorises from
 * the claims, and no database lookup decides whether a request is allowed.
 * Refresh tokens are long-lived, so they are stored hashed and rotated on use —
 * reuse of a rotated token revokes the whole chain.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "../errors";
import { env } from "../env";
import type { ActorRole } from "@/db/rls";

export interface AccessClaims {
  sub: string;
  role: Exclude<ActorRole, "PUBLIC">;
  /** Agent id, present only when the user has an agent record. */
  agt?: number;
  /** Token version, so a future revocation sweep can invalidate old shapes. */
  ver: number;
}

const TOKEN_VERSION = 1;

function secret(): Uint8Array {
  return new TextEncoder().encode(env().JWT_SECRET);
}

export async function issueAccessToken(claims: {
  userId: number;
  role: Exclude<ActorRole, "PUBLIC">;
  agentId?: number | null;
}): Promise<{ token: string; expiresIn: number }> {
  const e = env();
  const expiresIn = e.ACCESS_TOKEN_TTL_SECONDS;
  const jwt = new SignJWT({
    role: claims.role,
    ver: TOKEN_VERSION,
    ...(claims.agentId ? { agt: claims.agentId } : {}),
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(claims.userId))
    .setIssuer(e.JWT_ISSUER)
    .setAudience(e.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${expiresIn}s`);
  return { token: await jwt.sign(secret()), expiresIn };
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const e = env();
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: e.JWT_ISSUER,
      audience: e.JWT_AUDIENCE,
    });
    const role = payload.role;
    if (
      typeof payload.sub !== "string" ||
      (role !== "AGENT" && role !== "DISTRICT_ADMIN" && role !== "SUPER_ADMIN")
    ) {
      throw new ApiError("INVALID_TOKEN", "Token claims are malformed");
    }
    return {
      sub: payload.sub,
      role,
      agt: typeof payload.agt === "number" ? payload.agt : undefined,
      ver: typeof payload.ver === "number" ? payload.ver : 0,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const expired =
      error instanceof Error && error.name === "JWTExpired";
    throw new ApiError(
      expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      expired ? "Access token has expired" : "Access token is not valid",
    );
  }
}

/**
 * Refresh tokens are opaque random strings. Only their SHA-256 is stored, so a
 * database dump does not yield usable tokens.
 */
export function mintRefreshToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export function safeEquals(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
