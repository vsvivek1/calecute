import { issueLicense } from '@/lib/license';
import { json, preflight } from '@/lib/cors';
import { paidSession, stripe } from '@/lib/stripe';

export const OPTIONS = preflight;

// Re-issues a licence to someone who paid with this email. There is no
// email verification yet, so knowing a buyer's address is enough to unlock
// — acceptable for launch, to be replaced with an emailed magic link once
// an email provider is chosen.
export async function POST(req: Request) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  const clean = email?.trim().toLowerCase();
  if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return json(req, { error: 'Enter the email you paid with.' }, 400);
  }

  const sessions = await stripe().checkout.sessions.list({
    customer_details: { email: clean },
    status: 'complete',
    limit: 20,
  });
  const paid = sessions.data.map(paidSession).find(Boolean);
  if (!paid) return json(req, { error: 'No completed purchase found for that email.' }, 404);

  const license = issueLicense({ ...paid, iat: Math.floor(Date.now() / 1000) });
  return json(req, { license, email: paid.email });
}
