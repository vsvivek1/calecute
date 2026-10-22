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

export const siteOrigin = (req: Request) =>
  process.env.PUBLIC_SITE_ORIGIN ?? new URL(req.url).origin;

/** The licence-carrying fields of a paid session, or null if unpaid. */
export function paidSession(s: Stripe.Checkout.Session) {
  if (s.payment_status !== 'paid' || s.metadata?.product !== 'pmp-prep') return null;
  return { sid: s.id, email: s.customer_details?.email ?? s.customer_email ?? '' };
}
