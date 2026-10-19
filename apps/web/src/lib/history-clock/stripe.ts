import "server-only";
import Stripe from "stripe";

// History Clock takes payments through Stripe Checkout, in US dollars, for
// customers in the USA. Keys come from the environment only: a test key
// (sk_test_…) until launch. With no key set, the support page says payments
// are not open yet and the checkout route refuses.

export const PRODUCT = "history-clock-supporter";

let client: Stripe | null = null;

export const paymentsEnabled = () => Boolean(process.env.STRIPE_SECRET_KEY);

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(key);
  return client;
}

/** Price in US cents when no STRIPE_PRICE_ID is set. */
export const priceCents = () => Number(process.env.HISTORY_CLOCK_PRICE_CENTS ?? 499);

export const formatUsd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

/** The buyer's email for a paid History Clock session, or null if unpaid. */
export function paidSession(s: Stripe.Checkout.Session) {
  if (s.payment_status !== "paid" || s.metadata?.product !== PRODUCT) return null;
  return { email: s.customer_details?.email ?? s.customer_email ?? "" };
}
