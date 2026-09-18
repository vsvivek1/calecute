'use server';

import { revalidatePath } from 'next/cache';
import { serverClient } from '@/lib/supabase';
import { getSession, canAdminister } from '@/lib/session';

/**
 * Every action re-checks the role on the server.
 *
 * The button was only rendered for an admin, but a button is a suggestion —
 * anyone can post to a server action. The row-level security policy is the
 * real defence; this check exists so a refusal is a readable message rather
 * than a silent no-op.
 */
async function requireAdmin() {
  const session = await getSession();
  if (!canAdminister(session)) return null;
  return session;
}

export async function setFreeLimit(userId: string, limit: number | null) {
  const session = await requireAdmin();
  if (!session) return { error: 'Not an admin account' };

  const supabase = await serverClient();
  const { error } = await supabase
    .from('user_profile')
    .update({
      free_card_limit: limit,
      overrides_set_by: session.userId,
      overrides_set_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) return { error: error.message };

  await supabase.from('admin_audit').insert({
    actor_id: session.userId,
    action: 'set_free_card_limit',
    subject_id: userId,
    detail: { limit },
  });

  revalidatePath('/');
  return { ok: true };
}

export async function setComplimentary(userId: string, granted: boolean) {
  const session = await requireAdmin();
  if (!session) return { error: 'Not an admin account' };

  const supabase = await serverClient();
  const { error } = await supabase
    .from('user_profile')
    .update({
      free_tier_unlimited: granted,
      overrides_set_by: session.userId,
      overrides_set_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) return { error: error.message };

  await supabase.from('admin_audit').insert({
    actor_id: session.userId,
    action: granted ? 'grant_complimentary' : 'revoke_complimentary',
    subject_id: userId,
    detail: {},
  });

  revalidatePath('/');
  return { ok: true };
}
