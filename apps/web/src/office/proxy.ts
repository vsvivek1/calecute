/**
 * Session refresh for /login and /office, called from the site's proxy.ts.
 *
 * Supabase access tokens are short-lived. A Server Component cannot write
 * cookies, so an expired token is refreshed here, where the new cookies can be
 * written to the response and handed to this request's render.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { OFFICE_SUPABASE_KEY, OFFICE_SUPABASE_URL, officeConfigured } from "./config";

export function isOfficePath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/office" ||
    pathname.startsWith("/office/")
  );
}

export async function officeProxy(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  if (!officeConfigured) return response;

  const supabase = createServerClient(OFFICE_SUPABASE_URL, OFFICE_SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the token with Supabase and refreshes it if needed.
  await supabase.auth.getUser();
  return response;
}
