/**
 * Browser session handling.
 *
 * This is deliberately a FRONTEND concern, not an API one. The API is stateless
 * and knows only bearer tokens; cookies exist because a browser needs somewhere
 * to keep a token between page loads, and the Android app will not use any of
 * this. The brief's rule — "if you find yourself writing an endpoint that only
 * makes sense for a browser, it belongs in the frontend" — is why /auth/callback
 * lives here rather than under /api/v1.
 *
 * Tokens are held in httpOnly cookies rather than localStorage, so a script
 * injected into the page cannot read them. The trade-off is that the token is
 * attached by this server when it calls the API, not by the browser.
 */
import { cookies } from "next/headers";
import { api, type Session } from "./api/client";

const ACCESS_COOKIE = "ct_at";
const REFRESH_COOKIE = "ct_rt";
const VERIFIER_COOKIE = "ct_pkce";
const STATE_COOKIE = "ct_state";
const RETURN_COOKIE = "ct_return";

const secure = process.env.NODE_ENV === "production";

const baseCookie = {
  httpOnly: true,
  secure,
  // Lax rather than Strict: the Google redirect is a top-level navigation from
  // another origin, and Strict would drop the cookie on arrival.
  sameSite: "lax" as const,
  path: "/",
};

export async function setSessionCookies(session: Session): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, session.accessToken, {
    ...baseCookie,
    maxAge: session.expiresIn,
  });
  jar.set(REFRESH_COOKIE, session.refreshToken, {
    ...baseCookie,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, VERIFIER_COOKIE, STATE_COOKIE]) {
    jar.delete(name);
  }
}

export async function readAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

/**
 * The access token to use for this render, refreshing it if it has expired.
 *
 * Returns null when there is no usable session, which callers treat as "not
 * signed in" and redirect. A failed refresh clears the cookies rather than
 * leaving a stale pair that will fail on every subsequent page.
 */
export async function currentAccessToken(): Promise<string | null> {
  const access = await readAccessToken();
  if (access) return access;

  const refresh = await readRefreshToken();
  if (!refresh) return null;

  try {
    const session = await api.post<Session>("/auth/refresh", {
      refreshToken: refresh,
    });
    await setSessionCookies(session);
    return session.accessToken;
  } catch {
    await clearSessionCookies();
    return null;
  }
}

/* ------------------------------------------------------- OAuth handshake */

/** PKCE verifier, kept in a short-lived httpOnly cookie across the redirect. */
export async function stashOAuthState(params: {
  verifier: string;
  state: string;
  returnTo?: string;
}): Promise<void> {
  const jar = await cookies();
  const shortLived = { ...baseCookie, maxAge: 600 };
  jar.set(VERIFIER_COOKIE, params.verifier, shortLived);
  jar.set(STATE_COOKIE, params.state, shortLived);
  if (params.returnTo) jar.set(RETURN_COOKIE, params.returnTo, shortLived);
}

export async function takeOAuthState(): Promise<{
  verifier: string | null;
  state: string | null;
  returnTo: string | null;
}> {
  const jar = await cookies();
  const verifier = jar.get(VERIFIER_COOKIE)?.value ?? null;
  const state = jar.get(STATE_COOKIE)?.value ?? null;
  const returnTo = jar.get(RETURN_COOKIE)?.value ?? null;
  jar.delete(VERIFIER_COOKIE);
  jar.delete(STATE_COOKIE);
  jar.delete(RETURN_COOKIE);
  return { verifier, state, returnTo };
}
