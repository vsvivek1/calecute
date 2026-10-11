import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Exchanges the OAuth code for a session cookie.
 *
 * A route handler rather than a server component, because only a route handler
 * can actually set cookies on the response.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Keep the course the visitor came to buy, if it looks like a course id.
  const course = searchParams.get('course');
  const dest = course && /^[a-z0-9-]{1,64}$/.test(course)
    ? `${origin}/?course=${encodeURIComponent(course)}`
    : origin;
  if (!code) return NextResponse.redirect(origin);

  const store = await cookies();
  const response = NextResponse.redirect(dest);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
  }
  return response;
}
