// Verifies a Google Play purchase of one Energy Auditor paper and records
// the learner's ownership. Called by the Android app after a purchase and
// when it restores past purchases.
//
// POST { productId: "paper_1".."paper_4", purchaseToken }  (user JWT required)
// -> { papers: number[] }
//
// Secrets: GOOGLE_PLAY_SA_JSON (Play Console service account key JSON).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are built in.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const PACKAGE = "com.calecutech.energyauditor";
const PRODUCTS: Record<string, number> = { paper_1: 1, paper_2: 2, paper_3: 3, paper_4: 4 };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function b64url(data: ArrayBuffer | string) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function googleToken(sa: { client_email: string; private_key: string }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${b64url(sig)}`,
    }),
  });
  if (!res.ok) throw new Error(`google token ${res.status}`);
  return (await res.json()).access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Sign in first" }, 401);

  let body: { productId?: string; purchaseToken?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }
  const section = PRODUCTS[body.productId ?? ""];
  const token = body.purchaseToken ?? "";
  if (!section || token.length < 10 || token.length > 4096) return json({ error: "Bad request" }, 400);

  const saJson = Deno.env.get("GOOGLE_PLAY_SA_JSON");
  if (!saJson) return json({ error: "Purchases are not set up yet" }, 503);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // A token already recorded for someone else is never moved.
  const { data: owner } = await admin.rpc("em_play_token_owner", { p_token: token });
  if (owner && owner !== user.id) return json({ error: "This purchase belongs to another account" }, 409);

  let access: string;
  try {
    access = await googleToken(JSON.parse(saJson));
  } catch {
    return json({ error: "Purchases are not set up yet" }, 503);
  }
  const base = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE}` +
    `/purchases/products/${body.productId}/tokens/${encodeURIComponent(token)}`;
  const res = await fetch(base, { headers: { Authorization: `Bearer ${access}` } });
  if (!res.ok) return json({ error: "Purchase not found" }, 400);
  const p = await res.json();
  if (p.purchaseState !== 0) return json({ error: "Purchase is not complete" }, 402);
  if (p.obfuscatedExternalAccountId && p.obfuscatedExternalAccountId !== user.id) {
    return json({ error: "This purchase belongs to another account" }, 409);
  }

  const { data: papers, error } = await admin.rpc("em_record_play_purchase", {
    p_user: user.id,
    p_token: token,
    p_product: body.productId,
    p_section: section,
    p_order: p.orderId ?? null,
    p_time: p.purchaseTimeMillis ? new Date(Number(p.purchaseTimeMillis)).toISOString() : null,
  });
  if (error) return json({ error: "Could not save purchase" }, 500);

  // Unacknowledged purchases are refunded by Google after 3 days.
  if (p.acknowledgementState === 0) {
    await fetch(`${base}:acknowledge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
      body: "{}",
    });
  }

  return json({ papers });
});
