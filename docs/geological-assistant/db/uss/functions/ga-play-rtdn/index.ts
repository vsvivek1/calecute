/**
 * Google Play Real-time developer notifications for Geological Assistant.
 * Only voided purchases matter (refund or chargeback): the matching
 * subscriptions row becomes 'refunded', which ends access. Everything else is
 * acknowledged and ignored.
 *
 * Pub/Sub pushes here; it sends no Supabase JWT, so a shared secret in the
 * URL is the auth.
 *
 * Deploy (USS project):
 *   supabase functions deploy ga-play-rtdn --no-verify-jwt
 *   supabase secrets set PLAY_RTDN_KEY=<long random string>
 * Google Cloud > Pub/Sub: topic (grant google-play-developer-notifications@system.gserviceaccount.com
 * "Pub/Sub Publisher"), push subscription to
 *   https://vspbbwpehvenmxddgbhm.supabase.co/functions/v1/ga-play-rtdn?key=<PLAY_RTDN_KEY>
 * Play Console > Monetize > Monetization setup: that topic.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SCHEMA = 'geological_assistant';
const PACKAGE_NAME = 'com.calecutech.geologicalassistant';
const RTDN_KEY = Deno.env.get('PLAY_RTDN_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function sameString(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  if (!RTDN_KEY) return new Response('Not configured', { status: 503 });

  const key = new URL(req.url).searchParams.get('key') ?? '';
  if (!sameString(key, RTDN_KEY)) return new Response('Bad key', { status: 401 });

  let note: {
    packageName?: string;
    voidedPurchaseNotification?: { orderId?: string; purchaseToken?: string };
  };
  try {
    const push = await req.json();
    note = JSON.parse(atob(push.message?.data ?? ''));
  } catch {
    // A malformed message would be redelivered forever; drop it.
    return new Response('ignored', { status: 200 });
  }

  if (note.packageName !== PACKAGE_NAME) return new Response('ignored', { status: 200 });
  const voided = note.voidedPurchaseNotification;
  if (!voided) return new Response('ignored', { status: 200 });

  // ga-play-verify keys the row on the order id, or the token when there was none.
  const refs = [voided.orderId, voided.purchaseToken].filter(Boolean);
  if (refs.length === 0) return new Response('ignored', { status: 200 });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });
  const { error } = await admin
    .from('subscriptions')
    .update({ status: 'refunded' })
    .eq('provider', 'google_play')
    .in('provider_ref', refs);
  if (error) {
    console.error('could not mark the purchase refunded', error);
    // 500 makes Pub/Sub retry.
    return new Response('retry', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
