import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { claimReferral, ensureMember } from '@/lib/referral';

/**
 * Exchanges the Google OAuth code for a session cookie, then registers the
 * student with the Calecute referral scheme (and claims the inviter's code
 * when they arrived through an invite link).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const ref = searchParams.get('ref');
  if (!code) return NextResponse.redirect(origin);

  const store = await cookies();
  const response = NextResponse.redirect(origin);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error.message)}`);
  }

  const u = data.user;
  const meta = u.user_metadata ?? {};
  const student = {
    id: u.id,
    email: u.email ?? null,
    name: (meta.full_name ?? meta.name ?? null) as string | null,
    avatar: (meta.avatar_url ?? meta.picture ?? null) as string | null,
  };
  // Both are best-effort and never block sign-in.
  await Promise.all([ensureMember(student), ref ? claimReferral(student, ref) : null]);
  return response;
}
