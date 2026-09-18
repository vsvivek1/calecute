import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 *
 * Kept in its own file because the server client imports `next/headers`, and a
 * client component that reaches through a shared module drags that import into
 * the browser bundle — which fails the build rather than failing quietly.
 */
export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
