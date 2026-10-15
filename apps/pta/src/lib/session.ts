import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { DEMO } from './mode';
import { demoEmail, rpc } from './rpc';
import { serverClient } from './supabase';
import type { Child, Me } from './types';

export const CHILD_COOKIE = 'pta_child';
export const LANG_COOKIE = 'pta_lang';

/**
 * The signed-in user as the database sees them: their children, their staff
 * roles and the classes they teach. Nothing here comes from the URL or a
 * cookie the browser could forge; a page that shows staff controls asks this,
 * and RLS separately refuses the data to anyone who is not staff.
 */
export const getMe = cache(async (): Promise<Me | null> => {
  if (DEMO) {
    if (!(await demoEmail())) return null;
  } else {
    const supabase = await serverClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
  }
  return rpc<Me>('whoami');
});

export async function requireMe(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect('/signin');
  return me;
}

/** The child a parent is looking at. Defaults to the first. */
export async function currentChild(me: Me): Promise<Child | null> {
  if (me.children.length === 0) return null;
  const want = (await cookies()).get(CHILD_COOKIE)?.value;
  return me.children.find((c) => c.id === want) ?? me.children[0];
}

export async function requireChild(): Promise<{ me: Me; child: Child }> {
  const me = await requireMe();
  const child = await currentChild(me);
  if (!child) redirect(home(me));
  return { me, child };
}

export function isAdmin(me: Me, school?: string) {
  return me.staff.some((s) => s.role === 'admin' && (!school || s.school_id === school));
}

export function adminSchool(me: Me) {
  return me.staff.find((s) => s.role === 'admin') ?? null;
}

export async function requireAdmin() {
  const me = await requireMe();
  const school = adminSchool(me);
  if (!school) redirect(home(me));
  return { me, school };
}

export async function requireTeacher() {
  const me = await requireMe();
  if (me.classes.length === 0) redirect(home(me));
  return me;
}

/** Where a user lands: a parent on their child, staff on their own desk. */
export function home(me: Me) {
  if (me.children.length) return '/';
  if (me.classes.length && !adminSchool(me)) return '/teach';
  if (adminSchool(me)) return '/office';
  return '/welcome';
}

export async function lang(): Promise<'en' | 'ml'> {
  return (await cookies()).get(LANG_COOKIE)?.value === 'ml' ? 'ml' : 'en';
}
