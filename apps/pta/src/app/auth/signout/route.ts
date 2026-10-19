import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { DEMO, DEMO_COOKIE } from '@/lib/mode';
import { CHILD_COOKIE } from '@/lib/session';
import { serverClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const jar = await cookies();
  jar.delete(CHILD_COOKIE);
  if (DEMO) jar.delete(DEMO_COOKIE);
  else await (await serverClient()).auth.signOut();
  return NextResponse.redirect(new URL('/signin', request.url), { status: 303 });
}
