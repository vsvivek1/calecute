import { createHmac, timingSafeEqual } from 'node:crypto';

// A licence key is a signed statement that a Stripe Checkout session was
// paid. There are no accounts: the key is the account. It is verified on
// the server only, because the signing secret never leaves it.

export interface LicensePayload {
  /** Stripe Checkout session id. */
  sid: string;
  email: string;
  /** Issued at, unix seconds. */
  iat: number;
}

const PREFIX = 'PMP1';

function secret() {
  const s = process.env.LICENSE_SECRET;
  if (!s || s.length < 16) throw new Error('LICENSE_SECRET is not set');
  return s;
}

const sign = (body: string, key: string) =>
  createHmac('sha256', key).update(`${PREFIX}.${body}`).digest('base64url');

export function issueLicense(p: LicensePayload, key = secret()): string {
  const body = Buffer.from(JSON.stringify(p)).toString('base64url');
  return `${PREFIX}.${body}.${sign(body, key)}`;
}

export function verifyLicense(token: string | null | undefined, key = secret()): LicensePayload | null {
  if (!token) return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX) return null;
  const [, body, sig] = parts;
  const expected = Buffer.from(sign(body, key));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return typeof p?.sid === 'string' && typeof p?.email === 'string' ? p : null;
  } catch {
    return null;
  }
}

export const bearer = (req: Request) =>
  req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? null;

/**
 * Access codes are plain passwords set in the ACCESS_CODES env var
 * (comma-separated), for testers and reviewers. A matching code is swapped
 * for a normal signed licence, so the rest of the app needs no special case.
 * The codes live only in the environment, never in the source.
 */
export function isAccessCode(input: string | null | undefined, codes = process.env.ACCESS_CODES ?? ''): boolean {
  const given = Buffer.from((input ?? '').trim());
  if (!given.length) return false;
  return codes
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .some((c) => {
      const want = Buffer.from(c);
      return want.length === given.length && timingSafeEqual(want, given);
    });
}
