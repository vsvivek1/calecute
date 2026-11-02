import { issueLicense } from '@/lib/license';
import { paidSession, stripe } from '@/lib/stripe';

// Called by /unlock after Stripe redirects back. Exchanges a paid Checkout
// session id for a licence key. Session ids are unguessable and only reach
// the buyer, so holding one is proof enough.
export async function POST(req: Request) {
  const { sessionId } = (await req.json().catch(() => ({}))) as { sessionId?: string };
  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return Response.json({ error: 'Missing or malformed session id.' }, { status: 400 });
  }

  const session = await stripe().checkout.sessions.retrieve(sessionId).catch(() => null);
  const paid = session && paidSession(session);
  if (!paid) {
    return Response.json(
      { error: 'That payment has not completed. If you were charged, contact support.' },
      { status: 402 },
    );
  }

  const license = issueLicense({ ...paid, iat: Math.floor(Date.now() / 1000) });
  return Response.json({ license, email: paid.email });
}
