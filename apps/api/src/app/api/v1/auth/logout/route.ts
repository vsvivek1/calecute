/**
 * POST /api/v1/auth/logout
 *
 * Revokes the presented refresh token. The access token stays valid until it
 * expires — that is the trade-off of stateless auth, and why the access TTL is
 * 15 minutes.
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { anonymousWriteRoute, ok } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { revokeSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ refreshToken: z.string().min(16) });

export const POST = handler(
  anonymousWriteRoute({ name: "auth.logout", limit: RULES.auth }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);
    await revokeSession(body.refreshToken);
    return ok(ctx, { revoked: true });
  }),
);

export const OPTIONS = preflight;
