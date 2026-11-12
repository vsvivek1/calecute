import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { OFFICE_SUPABASE_KEY, OFFICE_SUPABASE_URL } from "../config";

/** Server client bound to this request's cookies (the signed-in person). */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(OFFICE_SUPABASE_URL, OFFICE_SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Server Components cannot set cookies; Server Actions can. The proxy
        // refreshes the session before render, so a read-only miss is harmless.
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* read-only context */
        }
      },
    },
  });
}
