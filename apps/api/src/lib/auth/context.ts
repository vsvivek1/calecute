/**
 * Turns an incoming request into an `Actor`, which is what `withRls` needs.
 *
 * Authorisation decisions are made here and in the database policies, never in
 * a client. The frontend is assumed hostile: it can claim any role it likes in
 * its own UI, and the only thing that matters is the signed claim in the JWT.
 */
import type { NextRequest } from "next/server";
import { ApiError } from "../errors";
import { verifyAccessToken, type AccessClaims } from "./tokens";
import { PUBLIC_ACTOR, type Actor, type ActorRole } from "@/db/rls";

export interface AuthedActor extends Actor {
  userId: number;
  role: Exclude<ActorRole, "PUBLIC">;
  agentId: number | null;
  claims: AccessClaims;
}

function bearer(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  if (!value || scheme.toLowerCase() !== "bearer") return null;
  return value.trim();
}

/** Returns the authenticated actor, or throws 401. */
export async function requireActor(request: NextRequest): Promise<AuthedActor> {
  const token = bearer(request);
  if (!token) {
    throw new ApiError("UNAUTHENTICATED", "Bearer token required", {
      headers: { "WWW-Authenticate": 'Bearer realm="calecute"' },
    });
  }
  const claims = await verifyAccessToken(token);
  return {
    userId: Number(claims.sub),
    role: claims.role,
    agentId: claims.agt ?? null,
    claims,
  };
}

/** Returns the actor if a valid token is present, otherwise the public actor. */
export async function optionalActor(
  request: NextRequest,
): Promise<Actor | AuthedActor> {
  const token = bearer(request);
  if (!token) return PUBLIC_ACTOR;
  try {
    return await requireActor(request);
  } catch {
    // A bad token on an endpoint that does not need one is treated as absent.
    return PUBLIC_ACTOR;
  }
}

/**
 * Require one of the listed roles.
 *
 * This is a coarse gate. The fine-grained "which districts" question is
 * answered by row-level security, not here, so a DISTRICT_ADMIN passing this
 * check still cannot read a row outside their assignments.
 */
export async function requireRole(
  request: NextRequest,
  roles: ReadonlyArray<Exclude<ActorRole, "PUBLIC">>,
): Promise<AuthedActor> {
  const actor = await requireActor(request);
  if (!roles.includes(actor.role)) {
    throw new ApiError(
      "ROLE_REQUIRED",
      `This endpoint requires one of: ${roles.join(", ")}`,
      { details: { required: roles, actual: actor.role } },
    );
  }
  return actor;
}

export const ADMIN_ROLES = ["DISTRICT_ADMIN", "SUPER_ADMIN"] as const;
export const SUPER_ONLY = ["SUPER_ADMIN"] as const;
