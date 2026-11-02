import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Server client bound to the request's cookies, talking to the pta schema. */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: { schema: 'pta' },
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          // Server components cannot set cookies; route handlers and actions do.
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            /* read-only context */
          }
        },
      },
    },
  );
}
