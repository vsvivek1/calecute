/**
 * Signed form tokens, used for the signup timing check.
 *
 * The problem with the obvious approach: ask the client how long the form took
 * to fill in. A bot answers "forty seconds" and the check is worthless. Moving
 * the clock to the web frontend does not help either — that frontend is just
 * another API client, and the Android app is a second one.
 *
 * So the API issues the token itself when the form is requested, signs it, and
 * verifies it on submission. Elapsed time is measured between OUR issue time
 * and OUR receipt time, and neither can be moved by a caller.
 *
 * The token is also single-purpose (its own audience) and short-lived, so it
 * cannot be reused as a credential or stockpiled in advance.
 */
import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "../errors";
import { env } from "../env";

const AUDIENCE = "calecute-signup-form";
/** Long enough to fill six fields carefully on a slow phone. */
const LIFETIME_SECONDS = 60 * 60;

function secret(): Uint8Array {
  return new TextEncoder().encode(env().JWT_SECRET);
}

export async function issueFormToken(userId: number): Promise<string> {
  return new SignJWT({ purpose: "signup" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(userId))
    .setIssuer(env().JWT_ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${LIFETIME_SECONDS}s`)
    .sign(secret());
}

export interface FormTiming {
  /** Milliseconds between the form being issued and this submission. */
  elapsedMs: number;
}

/**
 * Verify a form token and return how long the caller had it.
 *
 * A missing token is not an error: the Android app may not adopt this
 * immediately, and refusing a signup over a soft anti-abuse signal would cost
 * real applicants. It simply yields no timing evidence.
 */
export async function verifyFormToken(
  token: string | null | undefined,
  userId: number,
): Promise<FormTiming | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: env().JWT_ISSUER,
      audience: AUDIENCE,
    });

    if (payload.sub !== String(userId)) {
      // Issued to somebody else: a shared or replayed form.
      throw new ApiError(
        "VALIDATION_FAILED",
        "This form was issued to a different account. Reload and try again.",
      );
    }

    const issuedAt = typeof payload.iat === "number" ? payload.iat * 1000 : null;
    if (!issuedAt) return null;

    return { elapsedMs: Date.now() - issuedAt };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Expired or tampered: ask for a fresh form rather than guessing.
    throw new ApiError(
      "VALIDATION_FAILED",
      "This form has expired. Reload the page and try again.",
      { details: { field: "formToken" } },
    );
  }
}
