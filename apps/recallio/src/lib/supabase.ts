import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

import type { View } from './types';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/** Server client bound to the request's cookies. */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(URL, KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Server components cannot set cookies; the route handlers do.
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* read-only context */
        }
      },
    },
  });
}

const ADMIN_HOST =
  process.env.NEXT_PUBLIC_ADMIN_HOST ?? 'superuser.recallio.calecutech.com';

/**
 * Reads the view from the hostname.
 *
 * This chooses a layout and nothing else. Being on the admin host grants no
 * permission — every admin query is checked by a row-level security policy
 * against the signed-in user's role, so typing the address achieves nothing.
 */
export async function requestedView(): Promise<View> {
  const host = (await headers()).get('host')?.toLowerCase() ?? '';
  // Exact match, so a lookalike host cannot render the admin shell.
  return host === ADMIN_HOST.toLowerCase() ? 'admin' : 'user';
}
