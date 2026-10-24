/**
 * Creates a Razorpay order for a Geological Assistant course.
 *
 * Same contract as psc-app's razorpay-create-order, but reads and writes the
 * `geological_assistant` schema of the USS project, so it never touches USS's
 * own public tables. The client names a course; the price comes from
 * geological_assistant.courses, less any coupon (quote_price in 0004_coupons.sql
 * checks the code and works out the amount; the browser's word never counts).
 *
 * Deploy (USS project):
 *   supabase functions deploy ga-razorpay-create-order
 *   supabase secrets set RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=...
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SCHEMA = 'geological_assistant';
const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return json({ error: 'Payments are not set up yet' }, 503);
  }

  // The caller is whoever the JWT says, never a user id in the body.
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Not signed in' }, 401);

  let courseId: string;
  let couponCode: string | undefined;
  try {
    ({ courseId, couponCode } = await req.json());
  } catch {
    return json({ error: 'Bad body' }, 400);
  }
  if (!courseId) return json({ error: 'courseId is required' }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

  const { data: course } = await admin
    .from('courses')
    .select('id, name, price_minor, price_currency')
    .eq('id', courseId)
    .maybeSingle();
  if (!course) return json({ error: 'Unknown course' }, 404);
  if (!course.price_minor || course.price_minor <= 0) {
    return json({ error: 'This course has no price set' }, 409);
  }

  // Already paid: do not take the money twice.
  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .eq('status', 'active')
    .limit(1);
  if (existing && existing.length > 0) return json({ error: 'Already subscribed' }, 409);

  // The price after any coupon. A bad code is an error, not a silent full price,
  // so the buyer never pays more than the screen said.
  let amount = course.price_minor;
  let coupon: string | null = null;
  if (couponCode && String(couponCode).trim()) {
    const { data: quote, error: quoteError } = await admin
      .rpc('quote_price', { p_course_id: courseId, p_code: String(couponCode), p_user_id: user.id })
      .maybeSingle<{ code: string; price_minor: number }>();
    if (quoteError || !quote) return json({ error: quoteError?.message || 'This code is not valid' }, 400);
    amount = quote.price_minor;
    coupon = quote.code;
  }

  const currency = course.price_currency ?? 'INR';
  const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: `ga_${user.id.slice(0, 8)}_${Date.now()}`,
      // Echoed back on the webhook; `app` lets the webhook skip payments that
      // belong to other courses on the same Razorpay account.
      notes: { user_id: user.id, course_id: courseId, app: SCHEMA, coupon: coupon ?? '' },
    }),
  });

  if (!orderResponse.ok) {
    console.error('razorpay order failed', orderResponse.status, await orderResponse.text());
    return json({ error: 'Could not start the payment' }, 502);
  }
  const order = await orderResponse.json();

  const { error: insertError } = await admin.from('payment_orders').insert({
    user_id: user.id,
    course_id: courseId,
    provider: 'razorpay',
    provider_ref: order.id,
    amount_minor: amount,
    list_price_minor: course.price_minor,
    coupon_code: coupon,
    currency,
    status: order.status ?? 'created',
  });
  if (insertError) console.error('could not record the order', insertError);

  // The key id is public; the secret never leaves this function.
  return json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: RAZORPAY_KEY_ID,
    courseName: course.name,
    listPrice: course.price_minor,
    coupon,
  });
});
