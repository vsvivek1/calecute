/**
 * Razorpay webhook for Geological Assistant: the only thing that grants access.
 *
 * Writes geological_assistant.subscriptions in the USS project. One-time
 * payment, lifetime access: current_period_end stays null. The browser's
 * success callback grants nothing; only a payload signed with the webhook
 * secret does.
 *
 * Razorpay sends every account event to every webhook, so payments for other
 * courses arrive here too. Those are acknowledged (200) and ignored.
 *
 * Deploy (USS project; Razorpay sends no Supabase JWT, the signature is the auth):
 *   supabase functions deploy ga-razorpay-webhook --no-verify-jwt
 *   supabase secrets set RAZORPAY_WEBHOOK_SECRET=...
 * It also issues the GST tax invoice for each capture and a credit note for
 * each refund (geological_assistant.issue_invoice / issue_credit_note, both
 * idempotent, so a repeated delivery returns the document already issued).
 *
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
      current_period_end: null,
    },
    { onConflict: 'provider_ref' },
  );
  if (error) {
    console.error('could not record the subscription', error);
    // 500 makes Razorpay retry: the payment happened and the user is waiting.
    return new Response('retry', { status: 500 });
  }

  if (payment.order_id) {
    await admin
      .from('payment_orders')
      .update({ status: status === 'active' ? 'paid' : 'refunded' })
      .eq('provider_ref', payment.order_id);
  }

  // Access is already granted above; an invoice failure only makes Razorpay
  // retry, and the retry finds the subscription in place.
  const refund = event.payload?.refund?.entity;
  const { error: invoiceError } = status === 'active'
    ? await admin.rpc('issue_invoice', {
      p_payment_id: payment.id,
      p_order_id: payment.order_id ?? null,
      p_user_id: userId,
      p_course_id: courseId,
      p_paid_minor: payment.amount,
      p_email: payment.email ?? null,
      p_paid_at: new Date((payment.created_at ?? Date.now() / 1000) * 1000).toISOString(),
    })
    : refund?.id
    ? await admin.rpc('issue_credit_note', {
      p_refund_id: refund.id,
      p_payment_id: payment.id,
      p_refund_minor: refund.amount,
      p_refunded_at: new Date((refund.created_at ?? Date.now() / 1000) * 1000).toISOString(),
    })
    : { error: null };
  if (invoiceError) {
    console.error('could not issue the invoice', invoiceError);
    return new Response('retry', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
