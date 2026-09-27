/**
 * GET /auth/google/start
 *
 * Begins sign-in. A plain redirect, so the button that triggers it can be an
 * ordinary link and works with JavaScript disabled.
 */
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import {
  authorizationUrl,
  generateState,
  generateVerifier,
} from "@/lib/oauth";
import { stashOAuthState } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const verifier = generateVerifier();
  const state = generateState();

  // Only same-origin paths are honoured, so the parameter cannot be used to
  // bounce someone to another site after they sign in.
  const requested = request.nextUrl.searchParams.get("returnTo");
  const returnTo =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : undefined;

  await stashOAuthState({ verifier, state, returnTo });

  redirect(
    authorizationUrl({ origin: request.nextUrl.origin, state, verifier }),
  );
}
