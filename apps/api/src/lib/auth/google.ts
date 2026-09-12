/**
 * Google identity verification.
 *
 * Two entry points because the two clients legitimately differ:
 *
 *  - Android (and any native client) gets an ID token from Google Play
 *    services and sends it straight here.
 *  - The web frontend runs the authorization code flow, which works without
 *    JavaScript, and sends the code plus its PKCE verifier.
 *
 * Both end in the same place: a verified Google subject. A Google token is
 * never treated as a session — it is exchanged, once, for our own JWT.
 */
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ApiError } from "../errors";
import { env } from "../env";

const GOOGLE_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const JWKS_URL = new URL("https://www.googleapis.com/oauth2/v3/certs");
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// jose caches the key set and refreshes it on rotation.
const jwks = createRemoteJWKSet(JWKS_URL, {
  cacheMaxAge: 10 * 60 * 1000,
});

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

function audiences(): string[] {
  const e = env();
  return [e.GOOGLE_CLIENT_ID, e.GOOGLE_ANDROID_CLIENT_ID].filter(
    (v): v is string => Boolean(v),
  );
}

/** Verify a Google ID token's signature, issuer, audience and expiry. */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleIdentity> {
  let payload;
  try {
    ({ payload } = await jwtVerify(idToken, jwks, {
      issuer: GOOGLE_ISSUERS,
      audience: audiences(),
    }));
  } catch (error) {
    throw new ApiError(
      "INVALID_GOOGLE_TOKEN",
      "Google ID token could not be verified",
      { details: { reason: error instanceof Error ? error.message : "unknown" } },
    );
  }

  const sub = typeof payload.sub === "string" ? payload.sub : null;
  const email = typeof payload.email === "string" ? payload.email : null;
  if (!sub || !email) {
    throw new ApiError(
      "INVALID_GOOGLE_TOKEN",
      "Google ID token is missing sub or email",
    );
  }

  // An unverified Google email is a Google account someone created without
  // proving control of the mailbox. We accept the sign-in but record the fact,
  // and the admin review queue sees it.
  return {
    sub,
    email: email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : email.split("@")[0],
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

/**
 * Exchange an authorization code for an ID token, then verify it.
 *
 * `redirectUri` and `codeVerifier` come from the client that started the flow;
 * Google checks both, which is what stops a stolen code being redeemed here.
 */
export async function exchangeGoogleCode(params: {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
}): Promise<GoogleIdentity> {
  const e = env();
  const body = new URLSearchParams({
    code: params.code,
    client_id: e.GOOGLE_CLIENT_ID,
    client_secret: e.GOOGLE_CLIENT_SECRET,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });
  if (params.codeVerifier) body.set("code_verifier", params.codeVerifier);

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(
      "INVALID_GOOGLE_TOKEN",
      "Google rejected the authorization code",
      { details: { status: response.status, google: detail.slice(0, 300) } },
    );
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) {
    throw new ApiError(
      "INVALID_GOOGLE_TOKEN",
      "Google response did not include an ID token",
    );
  }
  return verifyGoogleIdToken(payload.id_token);
}
