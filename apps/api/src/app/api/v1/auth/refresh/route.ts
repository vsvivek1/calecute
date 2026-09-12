/**
 * POST /api/v1/auth/refresh
 *
 * Rotates a refresh token. Presenting an already-rotated token revokes every
 * session for that user — see rotateSession.
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { anonymousWriteRoute, ok } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { rotateSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ refreshToken: z.string().min(16) });

export const POST = handler(
  anonymousWriteRoute({ name: "auth.refresh", limit: RULES.auth }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);
    const clientKind = ctx.request.headers.get("x-client") ?? "unknown";
    const { tokens, user } = await rotateSession(body.refreshToken, clientKind);
    return ok(ctx, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
      user,
    });
  }),
);

export const OPTIONS = preflight;
