import { issueLicense } from '@/lib/license';
import { json, preflight } from '@/lib/cors';
import { paidSession, stripe } from '@/lib/stripe';
import { userFromRequest } from '@/lib/user';

export const OPTIONS = preflight;

// After Google sign-in: if this account's (verified) email has a paid
// checkout, issue its licence key. Replaces the old restore-by-email, which
// trusted any typed address.
export async function POST(req: Request) {
  const user = await userFromRequest(req);
  if (!user) return json(req, { error: 'Please sign in again.' }, 401);

  const sessions = await stripe().checkout.sessions.list({
    customer_details: { email: user.email },
    status: 'complete',
    limit: 20,
  });
  const paid = sessions.data.map(paidSession).find(Boolean);
  if (!paid) return json(req, { email: user.email, license: null });

  const license = issueLicense({ ...paid, iat: Math.floor(Date.now() / 1000) });
  return json(req, { email: user.email, license });
}
