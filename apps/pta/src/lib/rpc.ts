import 'server-only';

import { cookies } from 'next/headers';

import { DEMO, DEMO_COOKIE, DEMO_PEOPLE } from './mode';
import { demoRpc } from './demo-db';
import type { RpcName } from './rpc-names';
import { serverClient } from './supabase';

export class RpcError extends Error {}

/** Who the demo is being viewed as, or null when nobody has picked yet. */
export async function demoEmail(): Promise<string | null> {
  const v = (await cookies()).get(DEMO_COOKIE)?.value;
  return DEMO_PEOPLE.some((p) => p.email === v) ? v! : null;
}

/**
 * Calls one of the pta.* functions as the signed-in user.
 *
 * This is the only way the web app reads or writes data. The Flutter app
 * calls the same functions, so the two cannot drift apart.
 */
export async function rpc<T>(fn: RpcName, args: Record<string, unknown> = {}): Promise<T> {
  if (DEMO) {
    const email = await demoEmail();
    if (!email) throw new RpcError('Not signed in');
    try {
      return await demoRpc<T>(email, fn, args);
    } catch (e) {
      throw new RpcError(cleanMessage((e as Error).message));
    }
  }
  const supabase = await serverClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new RpcError(cleanMessage(error.message));
  return data as T;
}

// Postgres speaks to developers. Turn the common refusals into sentences a
// parent can act on; anything raised by our own functions is already one.
function cleanMessage(m: string) {
  if (/row-level security|permission denied/i.test(m)) {
    return 'Your account is not allowed to do that.';
  }
  if (/duplicate key/i.test(m)) return 'That has already been done.';
  return m.replace(/^ERROR:\s*/, '');
}
