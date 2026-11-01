import { bearer, isAccessCode, issueLicense, verifyLicense } from '@/lib/license';
import { json, preflight } from '@/lib/cors';

export const OPTIONS = preflight;

const CODE_EMAIL = 'access-code@calecutech.com';

export async function POST(req: Request) {
  const token = bearer(req);
  const p = verifyLicense(token);
  if (p) return json(req, { valid: true, email: p.email });
  // An access code unlocks like a purchase: hand back a real signed licence.
  if (isAccessCode(token)) {
    const license = issueLicense({ sid: 'access-code', email: CODE_EMAIL, iat: Math.floor(Date.now() / 1000) });
    return json(req, { valid: true, email: CODE_EMAIL, license });
  }
  return json(req, { valid: false }, 401);
}
