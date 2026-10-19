import { PRODUCT, paymentsEnabled, priceCents, stripe } from "@/lib/history-clock/stripe";
import { SITE_ORIGIN } from "@/lib/history-clock/content";

// The support page posts its form here. We create a Checkout session and
// send the browser to Stripe's hosted page with a 303.
export async function POST() {
  if (!paymentsEnabled()) {
    return new Response("Payments are not open yet.", { status: 503 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: priceCents(),
              product_data: {
                name: "History Clock supporter",
                description: "A one-time payment that funds new regions and entries. History Clock stays free.",
              },
            },
          },
    ],
    billing_address_collection: "required",
    metadata: { product: PRODUCT },
    payment_intent_data: { metadata: { product: PRODUCT } },
    success_url: `${SITE_ORIGIN}/history-clock/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_ORIGIN}/history-clock/support`,
  });

  if (!session.url) return new Response("Could not start checkout.", { status: 502 });
  return Response.redirect(session.url, 303);
}
