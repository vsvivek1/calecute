import { BANK } from '@/lib/bank';
import { bearer, verifyLicense } from '@/lib/license';
import { json, preflight } from '@/lib/cors';

export const OPTIONS = preflight;

// The full question bank, for licence holders only. Clients cache it so
// study works offline after the first unlock.
export async function GET(req: Request) {
  if (!verifyLicense(bearer(req))) {
    return json(req, { error: 'A valid licence key is required.' }, 401);
  }
  return json(req, { version: BANK_VERSION, questions: BANK });
}

const BANK_VERSION = BANK.length;
