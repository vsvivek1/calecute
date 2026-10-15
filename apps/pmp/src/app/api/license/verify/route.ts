import { bearer, verifyLicense } from '@/lib/license';
import { json, preflight } from '@/lib/cors';

export const OPTIONS = preflight;

export async function POST(req: Request) {
  const p = verifyLicense(bearer(req));
  return p ? json(req, { valid: true, email: p.email }) : json(req, { valid: false }, 401);
}
