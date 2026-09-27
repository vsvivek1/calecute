/**
 * GET /auth/callback
 *
 * Where Google sends the user back. Exchanges the code through the API, stores
 * the resulting tokens in httpOnly cookies, and routes by role.
 *
 * The role decision is not made here: it comes from `landing` in the /me
 * response, so the server decides where an account belongs and this page
 * follows. That is the same rule the brief sets for the rest of the frontend —
 * render what the API says, never infer permissions client-side.
 */
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { api, ApiError, type Session, type MeResponse } from "@/lib/api/client";
import { redirectUri } from "@/lib/oauth";
import { setSessionCookies, takeOAuthState } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const { verifier, state, returnTo } = await takeOAuthState();

  const googleError = params.get("error");
  if (googleError) {
    // Cancelling at Google's screen is a normal choice, not a failure.
    redirect(
      `/agents?auth=${googleError === "access_denied" ? "cancelled" : "failed"}`,
    );
  }

  const code = params.get("code");
  const returnedState = params.get("state");

  if (!code || !state || returnedState !== state) {
    redirect("/agents?auth=failed");
  }

  let session: Session;
  try {
    session = await api.post<Session>("/auth/google", {
      code,
      redirectUri: redirectUri(request.nextUrl.origin),
      ...(verifier ? { codeVerifier: verifier } : {}),
    });
  } catch (error) {
    if (error instanceof ApiError && error.code === "ACCOUNT_SUSPENDED") {
      redirect("/agents?auth=suspended");
    }
    redirect("/agents?auth=failed");
  }

  await setSessionCookies(session);

  if (returnTo) redirect(returnTo);

  const me = await api.get<MeResponse>("/me", { token: session.accessToken });
  redirect(me.landing ?? "/agents");
}
