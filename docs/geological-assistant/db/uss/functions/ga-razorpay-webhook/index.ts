/**
 * Razorpay webhook for Geological Assistant: the only thing that grants access.
 *
 * Writes geological_assistant.subscriptions in the USS project. One-time
 * payment, lifetime access (current_period_end null), except an order made with
 * a time-limited offer (payment_orders.access_days, e.g. CRASH30 = 30 days):
 * then access ends that many days after the payment. The browser's
 * success callback grants nothing; only a payload signed with the webhook
 * secret does.
 *
 * Razorpay sends every account event to every webhook, so payments for other
 * courses arrive here too. Those are acknowledged (200) and ignored.
 *
 * Deploy (USS project; Razorpay sends no Supabase JWT, the signature is the auth):
 *   supabase functions deploy ga-razorpay-webhook --no-verify-jwt
 *   supabase secrets set RAZORPAY_WEBHOOK_SECRET=...
 * Razorpay dashboard > Webhooks: URL .../functions/v1/ga-razorpay-webhook,
 * events payment.captured and refund.processed.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SCHEMA = 'geological_assistant';
const WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** HMAC-SHA256 of the raw body, compared in constant time. */
async function isSignatureValid(secret: string, raw: string, signature: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  if (!WEBHOOK_SECRET) return new Response('Not configured', { status: 503 });

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) return new Response('Unsigned', { status: 401 });

  // Byte-for-byte body; re-serialised JSON would not match the signature.
  const raw = await req.text();
  if (!(await isSignatureValid(WEBHOOK_SECRET, raw, signature))) {
    console.warn('rejected a webhook with a bad signature');
    return new Response('Bad signature', { status: 401 });
  }

  const event = JSON.parse(raw);
  const status =
    event.event === 'payment.captured' ? 'active'
    : event.event === 'refund.processed' ? 'refunded'
    : null;
  if (!status) return new Response('ignored', { status: 200 });

  // Refund events carry the original payment entity too, with its notes.
  const payment = event.payload?.payment?.entity;
  const notes = payment?.notes ?? {};
  const userId = notes.user_id;
  const courseId = notes.course_id;
  if (!payment?.id || !userId || !courseId) {
    return new Response('ignored', { status: 200 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

  // Not one of ours (another app on the same Razorpay account).
  const { data: course } = await admin.from('courses').select('id').eq('id', courseId).maybeSingle();
  if (!course) return new Response('ignored', { status: 200 });

  // Time-limited offer: access ends N days after the payment. Worked out from
  // the payment's own time, so a repeated delivery gives the same end date.
  let periodEnd: string | null = null;
  if (payment.order_id) {
    const { data: order } = await admin
      .from('payment_orders')
      .select('access_days')
      .eq('provider_ref', payment.order_id)
      .maybeSingle();
    const days = Number(order?.access_days ?? notes.access_days) || 0;
    if (days > 0) {
      const paidAt = payment.created_at ? payment.created_at * 1000 : Date.now();
      periodEnd = new Date(paidAt + days * 86400000).toISOString();
    }
  }

  // Upsert on provider_ref: webhooks are delivered more than once, and a
  // refund must update the same row the capture created.
  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      course_id: courseId,
      provider: 'razorpay',
      provider_ref: payment.id,
      amount_minor: payment.amount ?? null,
      status,
      current_period_end: periodEnd,
    },
    { onConflict: 'provider_ref' },
  );
  if (error) {
    console.error('could not record the subscription', error);
    // 500 makes Razorpay retry: the payment happened and the user is waiting.
    return new Response('retry', { status: 500 });
  }

  if (payment.order_id) {
    const newStatus = status === 'active' ? 'paid' : 'refunded';
    // Only the first delivery that flips the order to paid counts a coupon use.
    const { data: changed } = await admin
      .from('payment_orders')
      .update({ status: newStatus })
      .eq('provider_ref', payment.order_id)
      .neq('status', newStatus)
      .select('id, coupon_code');
    const code = newStatus === 'paid' ? changed?.[0]?.coupon_code : null;
    if (code) {
      const { error: redeemError } = await admin.rpc('redeem_coupon', { p_code: code });
      if (redeemError) console.error('could not count the coupon use', redeemError);
    }
    // Referral commission: added when paid, removed when refunded (0009_referrals.sql).
    const orderId = changed?.[0]?.id;
    if (orderId && changed?.[0]?.coupon_code) {
      const { error: settleError } = await admin.rpc('settle_referral', {
        p_order_id: orderId,
        p_paid: newStatus === 'paid',
      });
      if (settleError) console.error('could not settle the referral', settleError);
    }
  }

  return new Response('ok', { status: 200 });
});
