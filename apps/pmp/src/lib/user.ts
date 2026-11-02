import 'server-only';

export type User = { id: string; email: string };

/**
 * The signed-in Google user behind a Supabase access token, or null. Asks
 * Supabase Auth directly, so a forged or expired token is rejected there.
 */
export async function userFromRequest(req: Request): Promise<User | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;

  const r = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);
  if (!r?.ok) return null;
  const u = (await r.json()) as { id?: string; email?: string; email_confirmed_at?: string | null };
  // Google accounts arrive with a confirmed email; anything else is not trusted.
  if (!u.id || !u.email || !u.email_confirmed_at) return null;
  return { id: u.id, email: u.email.toLowerCase() };
}
