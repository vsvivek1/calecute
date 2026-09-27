/**
 * POST /api/v1/auth/google
 *
 * The only entry point to a session. Accepts either shape:
 *
 *   { "idToken": "…" }                                  ← Android / native
 *   { "code": "…", "redirectUri": "…", "codeVerifier": "…" }  ← web
 *
 * Both are verified against Google server-side and exchanged for our own
 * tokens. A Google token is never accepted as a session in its own right.
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { anonymousWriteRoute, ok } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { exchangeGoogleCode, verifyGoogleIdToken } from "@/lib/auth/google";
import { establishSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const bodySchema = z.union([
  z.object({
    idToken: z.string().min(16),
  }),
  z.object({
    code: z.string().min(8),
    redirectUri: z.string().url(),
    codeVerifier: z.string().min(32).optional(),
  }),
]);

export const POST = handler(
  anonymousWriteRoute({ name: "auth.google", limit: RULES.auth }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);
    const clientKind = ctx.request.headers.get("x-client") ?? "unknown";

    const identity =
      "idToken" in body
        ? await verifyGoogleIdToken(body.idToken)
        : await exchangeGoogleCode({
            code: body.code,
            redirectUri: body.redirectUri,
            codeVerifier: body.codeVerifier,
          });

    const { tokens, user } = await establishSession(identity, clientKind);

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
