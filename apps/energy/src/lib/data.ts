import 'server-only';

import { serverClient } from './supabase';
import type { Flash, Me, Paper, Today, User } from './types';

/**
 * Everything the pages read. Each call is one of the public.em_* database
 * functions; the study plan itself is decided there, not here.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? null,
    name: (meta.full_name ?? meta.name ?? null) as string | null,
    avatar: (meta.avatar_url ?? meta.picture ?? null) as string | null,
  };
}

async function rpc<T>(fn: string): Promise<T> {
  const supabase = await serverClient();
  const { data, error } = await supabase.rpc(fn);
  if (error) throw new Error(error.message);
  return data as T;
}

export const getCatalog = () => rpc<Paper[]>('em_catalog');
export const getMe = () => rpc<Me>('em_me');
export const getToday = () => rpc<Today>('em_today');
export const getFlash = () => rpc<Flash[]>('em_flash');
