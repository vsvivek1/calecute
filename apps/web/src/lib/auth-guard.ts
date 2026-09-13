/**
 * Page-level authentication for the agent and admin areas.
 *
 * The guard answers "who is this?" by asking the API, never by reading a role
 * out of a cookie. A cookie holds the access token and nothing else; the role
 * comes from GET /me, which derives it from the signed token server-side. A
 * modified client can change what it renders and gain nothing, because every
 * API call it makes is authorised again from the same token.
 */
import { redirect } from "next/navigation";
import { ApiError, getMe, type MeResponse } from "./api/client";
import { clearSessionCookies, currentAccessToken } from "./session";

export interface Session {
  token: string;
  me: MeResponse;
}

/**
 * Require a signed-in user. Redirects to Google sign-in if there is none,
 * returning here afterwards.
 */
export async function requireSession(returnTo: string): Promise<Session> {
  const token = await currentAccessToken();
  if (!token) {
    redirect(`/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`);
  }

  try {
    return { token, me: await getMe(token) };
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.code === "ACCOUNT_SUSPENDED")
    ) {
      await clearSessionCookies();
      redirect(
        error.code === "ACCOUNT_SUSPENDED"
          ? "/agents?auth=suspended"
          : `/auth/google/start?returnTo=${encodeURIComponent(returnTo)}`,
      );
    }
    throw error;
  }
}

/**
 * Require one of the given roles.
 *
 * This only decides what to render. The API rejects an out-of-role request on
 * its own, so a reader who bypasses this sees a shell with no data in it.
 */
export async function requireRole(
  returnTo: string,
  roles: ReadonlyArray<"AGENT" | "DISTRICT_ADMIN" | "SUPER_ADMIN">,
): Promise<Session> {
  const session = await requireSession(returnTo);
  const role = session.me.user?.role;
  if (!role || !roles.includes(role)) {
    // Send them where they do belong rather than showing a dead end.
    redirect(session.me.landing ?? "/agents");
  }
  return session;
}
