/**
 * Google Play purchase check for the Geological Assistant Android app: the
 * only thing that grants access for a Play purchase.
 *
 * The app sends { productId, purchaseToken } with the user's Supabase JWT.
 * This function asks the Google Play Developer API whether the token is a
 * paid purchase of that product, checks it was bought by this account (the
 * app sets the purchase's obfuscated account id to sha256(user id)), writes
 * geological_assistant.subscriptions and acknowledges the purchase. Google
 * refunds purchases that are not acknowledged within 3 days, so a purchase
 * that never reached this function is not lost money for the student.
 *
 * Safe to call again with the same token (restore, retries): the row is keyed
 * on the Play order id.
 *
 * Deploy (USS project; the JWT is verified, the app is always signed in):
 *   supabase functions deploy ga-play-verify
 *   supabase secrets set GOOGLE_PLAY_SERVICE_ACCOUNT="$(cat service-account.json)"
 * The service account needs Play Console > Users and permissions: "View
 * financial data, orders and cancellation survey responses" and "Manage
 * orders and subscriptions" for this app.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SCHEMA = 'geological_assistant';
const PACKAGE_NAME = 'com.calecutech.geologicalassistant';
const SERVICE_ACCOUNT = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/** Play product id -> course it unlocks. Anything else is refused. */
const PRODUCTS: Record<string, string> = {
  geological_assistant_lifetime: 'geological-assistant',
};

const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function base64url(bytes: Uint8Array | string) {
  const raw = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  let s = '';
  for (const b of raw) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };

let cachedToken: { value: string; expiresAt: number } | null = null;

/** OAuth access token for the service account (JWT bearer grant, RS256). */
async function googleAccessToken(sa: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.value;

  const tokenUri = sa.token_uri ?? 'https://oauth2.googleapis.com/token';
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: tokenUri,
      iat: now,
      exp: now + 3600,
    }),
  );

  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  );
  const assertion = `${header}.${claims}.${base64url(new Uint8Array(signature))}`;

  const res = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}: ${await res.text()}`);
  const body = await res.json();
  cachedToken = { value: body.access_token, expiresAt: now + (body.expires_in ?? 3600) };
  return cachedToken.value;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (!SERVICE_ACCOUNT) return json({ error: 'not_configured' }, 503);

  // The buyer is whoever the JWT says, never a user id in the body.
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'not_signed_in' }, 401);

  let productId: string, purchaseToken: string;
  try {
    ({ productId, purchaseToken } = await req.json());
  } catch {
    return json({ error: 'bad_body' }, 400);
  }
  const courseId = PRODUCTS[productId];
  if (!courseId || typeof purchaseToken !== 'string' || !purchaseToken) {
    return json({ error: 'bad_body' }, 400);
  }

  let sa: ServiceAccount;
  try {
    sa = JSON.parse(SERVICE_ACCOUNT);
  } catch {
    console.error('GOOGLE_PLAY_SERVICE_ACCOUNT is not valid JSON');
    return json({ error: 'not_configured' }, 503);
  }

  const url = `${API}/purchases/products/${encodeURIComponent(productId)}/tokens/${
    encodeURIComponent(purchaseToken)
  }`;
  let accessToken: string;
  let purchase: Record<string, unknown>;
  try {
    accessToken = await googleAccessToken(sa);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (res.status === 400 || res.status === 404 || res.status === 410) {
      // Not a token Google knows for this product.
      console.warn('play rejected the token', res.status, await res.text());
      return json({ error: 'not_purchased' }, 409);
    }
    if (!res.ok) throw new Error(`play ${res.status}: ${await res.text()}`);
    purchase = await res.json();
  } catch (e) {
    console.error('could not ask Google Play', e);
    return json({ error: 'google_unavailable' }, 502);
  }

  // 0 purchased, 1 cancelled, 2 pending.
  if (purchase.purchaseState !== 0) return json({ error: 'not_purchased' }, 409);

  // Bought from this app under another account: a token can't be moved.
  const owner = purchase.obfuscatedExternalAccountId;
  if (owner && owner !== (await sha256Hex(user.id))) {
    console.warn('purchase belongs to another account', purchase.orderId);
    return json({ error: 'other_account' }, 403);
  }

  const providerRef = (purchase.orderId as string | undefined) || purchaseToken;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

  const { data: existing, error: readError } = await admin
    .from('subscriptions')
    .select('user_id, status')
    .eq('provider_ref', providerRef)
    .maybeSingle();
  if (readError) {
    console.error('could not read subscriptions', readError);
    return json({ error: 'retry' }, 500);
  }
  // Same order already unlocked someone else (purchase made without an account id).
  if (existing && existing.user_id !== user.id) return json({ error: 'other_account' }, 403);
  if (existing?.status === 'refunded') return json({ error: 'refunded' }, 409);

  if (!existing) {
    const micros = Number(purchase.priceAmountMicros);
    const { error } = await admin.from('subscriptions').upsert(
      {
        user_id: user.id,
        course_id: courseId,
        provider: 'google_play',
        provider_ref: providerRef,
        // Micros -> paise; Play's products API usually leaves the price out.
        amount_minor: Number.isFinite(micros) && micros > 0 ? Math.round(micros / 10_000) : null,
        status: 'active',
        current_period_end: null,
      },
      { onConflict: 'provider_ref' },
    );
    if (error) {
      console.error('could not record the subscription', error);
      return json({ error: 'retry' }, 500);
    }
    if (purchase.purchaseType === 0) console.log('test purchase recorded', providerRef);
  }

  // Acknowledge so Google keeps the money; the app's completePurchase does
  // the same, whichever comes first wins.
  if (purchase.acknowledgementState === 0) {
    const ack = await fetch(`${url}:acknowledge`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!ack.ok) console.error('acknowledge failed', ack.status, await ack.text());
  }

  return json({ ok: true, courseId });
});
