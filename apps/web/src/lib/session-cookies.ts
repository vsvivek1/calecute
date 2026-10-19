/**
 * Session cookie names and options, shared by the render-time helpers in
 * session.ts and the request proxy (src/proxy.ts). Kept free of Next.js server
 * imports so the proxy can use it.
 */
export const ACCESS_COOKIE = "ct_at";
export const REFRESH_COOKIE = "ct_rt";

export const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  // Lax rather than Strict: the Google redirect is a top-level navigation from
  // another origin, and Strict would drop the cookie on arrival.
  sameSite: "lax" as const,
  path: "/",
};
