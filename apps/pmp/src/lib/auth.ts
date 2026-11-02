'use client';

import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { API, IS_APP } from './env';
import { clearLicense, saveLicense } from './store';

// Google sign-in through Supabase Auth. Supabase only proves who the learner
// is; whether they paid is still answered by Stripe (/api/license/account),
// which hands back the same licence key the rest of the app already uses.

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Deep link the Android app registers to receive the OAuth code. */
export const APP_REDIRECT = 'com.calecutech.pmpprep://auth';

export const AUTH_ENABLED = Boolean(SB_URL && KEY);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!SB_URL || !KEY) throw new Error('Sign-in is not configured.');
  client ??= createClient(SB_URL, KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: !IS_APP },
  });
  return client;
}

export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(AUTH_ENABLED ? undefined : null);
  useEffect(() => {
    if (!AUTH_ENABLED) return;
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}

/**
 * Web: a normal redirect to Google and back to `next` (a path on this site).
 * Android: Google refuses sign-in inside a WebView, so open a Custom Tab and
 * catch the code on the app's deep link (see listenForAppSignIn).
 */
export async function signInWithGoogle(next = '/unlock') {
  const sb = supabase();
  if (!IS_APP) {
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) throw error;
    return;
  }
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: APP_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data.url) throw error ?? new Error('Could not start sign-in.');
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url: data.url });
}

/** Android only: finish sign-in when the Custom Tab hands the code back. */
export async function listenForAppSignIn(onError: (e: Error) => void) {
  if (!IS_APP || !AUTH_ENABLED) return () => {};
  const { App } = await import('@capacitor/app');
  const { Browser } = await import('@capacitor/browser');
  const handle = await App.addListener('appUrlOpen', async ({ url }) => {
    if (!url.startsWith(APP_REDIRECT)) return;
    await Browser.close().catch(() => {});
    const code = new URL(url).searchParams.get('code');
    if (!code) return onError(new Error('Sign-in was cancelled.'));
    const { error } = await supabase().auth.exchangeCodeForSession(code);
    if (error) onError(error);
  });
  return () => void handle.remove();
}

export type Account = { email: string; license: string | null };

/** Asks the server whether this Google account has paid; saves the key if so. */
export async function fetchAccount(session: Session): Promise<Account> {
  const r = await fetch(`${API}/api/license/account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const data = (await r.json().catch(() => ({}))) as Partial<Account> & { error?: string };
  if (!r.ok) throw new Error(data.error ?? 'Could not check your purchase.');
  if (data.license) saveLicense(data.license, data.email);
  return { email: data.email ?? '', license: data.license ?? null };
}

export async function signOut() {
  if (AUTH_ENABLED) await supabase().auth.signOut().catch(() => {});
  clearLicense();
}
