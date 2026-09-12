/**
 * Turning a verified Google identity into our own session.
 *
 * Runs with owner privileges rather than under RLS: at this point there is no
 * `app.user_id` to scope by, and the operation is narrowly defined — find the
 * user by Google subject or email, create them if absent, issue tokens.
 *
 * Role assignment happens here and only here. A brand new account is always an
 * AGENT. The SUPER_ADMIN rows are pre-seeded, so when one of those addresses
 * signs in for the first time we attach the Google subject to the existing row
 * and the role comes along with it. No email address is ever compared against a
 * constant in application code.
 */
import { and, eq, isNull, sql as raw } from "drizzle-orm";
import { withOwnerPrivileges } from "@/db/rls";
import { agents, refreshTokens, users } from "@/db/schema";
import { ApiError } from "../errors";
import { env } from "../env";
import {
  hashRefreshToken,
  issueAccessToken,
  mintRefreshToken,
} from "./tokens";
import type { GoogleIdentity } from "./google";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: "AGENT" | "DISTRICT_ADMIN" | "SUPER_ADMIN";
  pictureUrl: string | null;
  agentId: number | null;
}

export async function establishSession(
  identity: GoogleIdentity,
  clientKind: string,
): Promise<{ tokens: SessionTokens; user: SessionUser }> {
  return withOwnerPrivileges(async (tx) => {
    // Match on the Google subject first — it is the stable identity. Fall back
    // to email so a pre-seeded admin row is claimed on first sign-in.
    const bySub = await tx
      .select()
      .from(users)
      .where(eq(users.googleSub, identity.sub))
      .limit(1);

    let user = bySub[0];

    if (!user) {
      const byEmail = await tx
        .select()
        .from(users)
        .where(raw`lower(${users.email}) = ${identity.email}`)
        .limit(1);

      if (byEmail[0]) {
        const claimed = await tx
          .update(users)
          .set({
            googleSub: identity.sub,
            name: byEmail[0].name || identity.name,
            pictureUrl: identity.picture ?? byEmail[0].pictureUrl,
            emailVerified: identity.emailVerified,
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, byEmail[0].id))
          .returning();
        user = claimed[0];
      } else {
        const created = await tx
          .insert(users)
          .values({
            googleSub: identity.sub,
            email: identity.email,
            emailVerified: identity.emailVerified,
            name: identity.name,
            pictureUrl: identity.picture ?? null,
            // Never anything but AGENT here. Elevation is an explicit admin
            // action recorded in the audit log.
            role: "AGENT",
            lastLoginAt: new Date(),
          })
          .returning();
        user = created[0];
      }
    } else {
      const refreshed = await tx
        .update(users)
        .set({
          name: user.name || identity.name,
          pictureUrl: identity.picture ?? user.pictureUrl,
          emailVerified: identity.emailVerified,
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();
      user = refreshed[0];
    }

    if (user.status === "SUSPENDED" || user.status === "DELETED") {
      throw new ApiError(
        "ACCOUNT_SUSPENDED",
        "This account is not active. Contact support.",
      );
    }

    const agentRow = await tx
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.userId, user.id))
      .limit(1);
    const agentId = agentRow[0]?.id ?? null;

    const tokens = await issueTokens(tx, {
      userId: user.id,
      role: user.role,
      agentId,
      clientKind,
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        pictureUrl: user.pictureUrl,
        agentId,
      },
    };
  });
}

type Tx = Parameters<Parameters<typeof withOwnerPrivileges>[0]>[0];

async function issueTokens(
  tx: Tx,
  params: {
    userId: number;
    role: "AGENT" | "DISTRICT_ADMIN" | "SUPER_ADMIN";
    agentId: number | null;
    clientKind: string;
  },
): Promise<SessionTokens> {
  const { token: accessToken, expiresIn } = await issueAccessToken({
    userId: params.userId,
    role: params.role,
    agentId: params.agentId,
  });
  const refresh = mintRefreshToken();
  await tx.insert(refreshTokens).values({
    userId: params.userId,
    tokenHash: refresh.hash,
    clientKind: params.clientKind,
    expiresAt: new Date(Date.now() + env().REFRESH_TOKEN_TTL_SECONDS * 1000),
  });
  return {
    accessToken,
    refreshToken: refresh.token,
    expiresIn,
    tokenType: "Bearer",
  };
}

/**
 * Rotate a refresh token.
 *
 * Presenting a token that was already rotated means either a replay or a stolen
 * token, and we cannot tell which — so the whole chain for that user is
 * revoked and they sign in again.
 */
export async function rotateSession(
  presented: string,
  clientKind: string,
): Promise<{ tokens: SessionTokens; user: SessionUser }> {
  const hash = hashRefreshToken(presented);

  return withOwnerPrivileges(async (tx) => {
    const rows = await tx
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hash))
      .limit(1);
    const existing = rows[0];

    if (!existing) {
      throw new ApiError("INVALID_TOKEN", "Refresh token is not recognised");
    }

    if (existing.revokedAt || existing.replacedBy) {
      await tx
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(refreshTokens.userId, existing.userId),
            isNull(refreshTokens.revokedAt),
          ),
        );
      throw new ApiError(
        "REFRESH_TOKEN_REUSED",
        "This refresh token was already used. All sessions have been revoked; sign in again.",
      );
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new ApiError("TOKEN_EXPIRED", "Refresh token has expired");
    }

    const userRows = await tx
      .select()
      .from(users)
      .where(eq(users.id, existing.userId))
      .limit(1);
    const user = userRows[0];
    if (!user || user.status !== "ACTIVE") {
      throw new ApiError("ACCOUNT_SUSPENDED", "This account is not active");
    }

    const agentRow = await tx
      .select({ id: agents.id })
      .from(agents)
      .where(eq(agents.userId, user.id))
      .limit(1);
    const agentId = agentRow[0]?.id ?? null;

    const tokens = await issueTokens(tx, {
      userId: user.id,
      role: user.role,
      agentId,
      clientKind,
    });

    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, existing.id));

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        pictureUrl: user.pictureUrl,
        agentId,
      },
    };
  });
}

export async function revokeSession(presented: string): Promise<void> {
  const hash = hashRefreshToken(presented);
  await withOwnerPrivileges(async (tx) => {
    await tx
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, hash));
  });
}
