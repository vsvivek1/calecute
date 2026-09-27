import { serverClient } from './supabase';
import type { Role, Session } from './types';

/**
 * The signed-in user and their real role.
 *
 * The role is read from the database, never from the URL, a cookie or
 * anything the browser can set. A page that wants to show admin controls asks
 * this; a query that returns admin data is separately protected by RLS, so a
 * mistake here leaks a button, not data.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: admin } = await supabase
    .from('app_admins')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  const meta = user.user_metadata ?? {};
  return {
    userId: user.id,
    email: user.email ?? null,
    name: (meta.full_name ?? meta.name ?? null) as string | null,
    avatar: (meta.avatar_url ?? meta.picture ?? null) as string | null,
    role: (admin?.role as Role) ?? 'user',
  };
}

export function canAdminister(session: Session | null): boolean {
  return session?.role === 'admin' || session?.role === 'superuser';
}

/** Only a superuser may switch between the two views. */
export function canSwitchViews(session: Session | null): boolean {
  return session?.role === 'superuser';
}
