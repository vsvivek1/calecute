/**
 * Unsubscribe from offer emails (offers.contacts, 0011_offer_emails.sql).
 *
 *   GET  ?t=TOKEN               -> { email: "ab•••@gmail.com", unsubscribed: bool } for the page
 *   POST ?t=TOKEN or {t: TOKEN} -> unsubscribes. Mail apps' one-click button posts here too
 *                                  (List-Unsubscribe-Post: List-Unsubscribe=One-Click).
 *
 * The page people see is calecutech.com/offers/unsubscribe (Supabase functions cannot serve HTML).
 *
 * Deploy (USS project; no Supabase JWT, the token is the key):
 *   supabase functions deploy offer-unsubscribe --no-verify-jwt
 */
import postgres from 'npm:postgres@3.4.5';

const db = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 1 });
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mask(email: string) {
  const [u, d] = email.split('@');
  return d ? `${u.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(5, u.length - 2)))}@${d}` : email;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const url = new URL(req.url);
  let t = url.searchParams.get('t') ?? '';
  if (!t && req.method === 'POST' && (req.headers.get('content-type') ?? '').includes('json')) {
    try { t = String((await req.json()).t ?? ''); } catch { /* no body */ }
  }
  if (!UUID.test(t)) return json({ error: 'This link is not valid' }, 400);

  if (req.method === 'GET') {
    const [row] = await db`select email, unsubscribed_at from offers.contacts where token = ${t}`;
    if (!row) return json({ error: 'This link is not valid' }, 404);
    return json({ email: mask(row.email), unsubscribed: !!row.unsubscribed_at });
  }
  if (req.method === 'POST') {
    const [row] = await db`update offers.contacts set unsubscribed_at = coalesce(unsubscribed_at, now())
      where token = ${t} returning email`;
    if (!row) return json({ error: 'This link is not valid' }, 404);
    return json({ email: mask(row.email), unsubscribed: true });
  }
  return json({ error: 'GET or POST' }, 405);
});
