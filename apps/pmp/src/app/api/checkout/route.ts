import { priceCents, siteOrigin, stripe } from '@/lib/stripe';
import { userFromRequest } from '@/lib/user';

// Buyers sign in with Google first, and checkout is locked to that account's
// email, so the purchase can always be found again from the account.
export async function POST(req: Request) {
  const user = await userFromRequest(req);
  if (!user) return Response.json({ error: 'Please sign in with Google first.' }, { status: 401 });
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
                  'Full question bank, timed mock exams, spaced review and weak-area drills. One-time payment.',
              },
            },
          },
    ],
    customer_email: user.email,
    client_reference_id: user.id,
    customer_creation: 'always',
    allow_promotion_codes: true,
    metadata: { product: 'pmp-prep', user_id: user.id },
    payment_intent_data: { metadata: { product: 'pmp-prep', user_id: user.id } },
    success_url: `${origin}/unlock?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
  });

  return Response.json({ url: session.url });
}
