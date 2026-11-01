import 'server-only';
import Stripe from 'stripe';

let client: Stripe | null = null;

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  client ??= new Stripe(key);
  return client;
}

export const priceCents = () => Number(process.env.PRICE_CENTS ?? 3900);

/**
 * Accounts listed in TEST_PRICE_EMAILS (comma-separated, verified Google
 * emails) pay TEST_PRICE_CENTS (default $1) so the owner can test live
 * checkout. Everyone else pays the normal price.
 */
export function testPriceCents(email: string, list = process.env.TEST_PRICE_EMAILS ?? ''): number | null {
  const e = email.trim().toLowerCase();
  const listed = list.split(',').some((x) => x.trim().toLowerCase() === e && e !== '');
  return listed ? Number(process.env.TEST_PRICE_CENTS ?? 100) : null;
}

export const siteOrigin = (req: Request) =>
  process.env.PUBLIC_SITE_ORIGIN ?? new URL(req.url).origin;

/** The licence-carrying fields of a paid session, or null if unpaid. */
export function paidSession(s: Stripe.Checkout.Session) {
  if (s.payment_status !== 'paid' || s.metadata?.product !== 'pmp-prep') return null;
  return { sid: s.id, email: s.customer_details?.email ?? s.customer_email ?? '' };
}
