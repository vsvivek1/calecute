import { createBrowserClient } from "@supabase/ssr";
import { OFFICE_SUPABASE_KEY, OFFICE_SUPABASE_URL } from "../config";

/**
 * Browser client, used only for file uploads (they go straight to storage
 * rather than through a Server Action, which caps request bodies at 1 MB).
 * Kept apart from the server client so `next/headers` never reaches a
 * client bundle.
 */
export function browserClient() {
  return createBrowserClient(OFFICE_SUPABASE_URL, OFFICE_SUPABASE_KEY);
}
