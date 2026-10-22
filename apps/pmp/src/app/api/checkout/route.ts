import { priceCents, siteOrigin, stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const origin = siteOrigin(req);
  const priceId = process.env.STRIPE_PRICE_ID;

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    line_items: [
      priceId
        ? { price: priceId, quantity: 1 }
        : {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: priceCents(),
              product_data: {
                name: 'Calecutech PMP Prep: full access',
                description:
                  'Full question bank, a daily plan to your exam date, spaced repetition, weekly reports and timed mocks. One-time payment.',
              },
            },
          },
    ],
    customer_creation: 'always',
    allow_promotion_codes: true,
    metadata: { product: 'pmp-prep' },
    payment_intent_data: { metadata: { product: 'pmp-prep' } },
    success_url: `${origin}/unlock?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
  });

  return Response.json({ url: session.url });
}
