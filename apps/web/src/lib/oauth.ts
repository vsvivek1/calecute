/**
 * Google's authorization-code flow with PKCE.
 *
 * The code flow is used rather than the Google Identity Services button for one
 * reason that matters here: it is a plain link and a plain redirect, so signing
 * in works on a cheap phone with a slow connection and does not depend on a
 * third-party script loading at all. GIS would add ~90KB and a hard dependency
 * on JavaScript for the single most important action on the page.
 */
import { createHash, randomBytes } from "node:crypto";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export function generateVerifier(): string {
  return randomBytes(48).toString("base64url");
}

export function challengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function generateState(): string {
  return randomBytes(16).toString("base64url");
}

export function redirectUri(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/callback`;
}

export function authorizationUrl(params: {
  origin: string;
  state: string;
  verifier: string;
}): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Sign-in cannot work without it.",
    );
  }
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(params.origin),
    response_type: "code",
    // Only what we use: the subject, the email, and a display name.
    scope: "openid email profile",
    state: params.state,
    code_challenge: challengeFor(params.verifier),
    code_challenge_method: "S256",
    // Keeps the account chooser predictable on a shared phone, which is common
    // in the Akshaya-centre setting this programme recruits from.
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${query}`;
}
