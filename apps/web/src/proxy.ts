/**
 * Refreshes an expired session before an admin or agent page renders.
 *
 * The access cookie lives for minutes; the refresh cookie for a month. When
 * the access cookie has expired, the page would have to refresh during render,
 * but a Server Component may not write cookies, and refresh tokens are
 * single-use (presenting a used one revokes every session). So the refresh
 * happens here, where the new pair can be written to the response and also
 * passed to the render on the same request.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  baseCookie,
} from "@/lib/session-cookies";

interface Session {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

async function refresh(refreshToken: string): Promise<Session | null> {
  const base = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  try {
    const response = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Client": "web",
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as Session;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  if (request.cookies.get(ACCESS_COOKIE)?.value) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return NextResponse.next();

  const session = await refresh(refreshToken);

  if (!session) {
    // A dead refresh token: drop it so the page sends the user to sign in
    // instead of trying (and failing) to refresh again during render.
    request.cookies.delete(REFRESH_COOKIE);
    const response = NextResponse.next({ request: { headers: request.headers } });
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  // Let this request's render see the new tokens...
  request.cookies.set(ACCESS_COOKIE, session.accessToken);
  request.cookies.set(REFRESH_COOKIE, session.refreshToken);
  const response = NextResponse.next({ request: { headers: request.headers } });

  // ...and keep them in the browser for the next one.
  response.cookies.set(ACCESS_COOKIE, session.accessToken, {
    ...baseCookie,
    maxAge: session.expiresIn,
  });
  response.cookies.set(REFRESH_COOKIE, session.refreshToken, {
    ...baseCookie,
    maxAge: REFRESH_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/agents/:path*"],
};
