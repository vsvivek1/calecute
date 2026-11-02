import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client. Kept apart from the server client so that
 * `next/headers` never reaches the browser bundle.
 */
export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
