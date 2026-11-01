'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import BuyButton, { startCheckout } from '@/components/BuyButton';
import GoogleButton from '@/components/GoogleButton';
import { AUTH_ENABLED, fetchAccount, listenForAppSignIn, signOut, useSession } from '@/lib/auth';
import { API, IS_APP } from '@/lib/env';
import { postJson, saveLicense, savedEmail, useLicense } from '@/lib/store';

type Claim = { license: string; email: string };
type Status = 'idle' | 'claiming' | 'claimed' | 'checking' | 'unpaid' | 'checkout' | 'error';

export default function UnlockPage() {
  const router = useRouter();
  const license = useLicense();
  const session = useSession();
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const checked = useRef<string | null>(null);
  // Read before Supabase tidies the sign-in code out of the URL.
  const wantsToBuy = useRef(false);

  // Back from Stripe: swap the paid session for a licence key.
  useEffect(() => {
    wantsToBuy.current = !IS_APP && new URLSearchParams(window.location.search).get('buy') === '1';
    const sid = new URLSearchParams(window.location.search).get('session_id');
    if (!sid) return;
    setStatus('claiming');
    postJson<Claim>('/api/license/claim', { sessionId: sid })
      .then((c) => {
        saveLicense(c.license, c.email);
        setStatus('claimed');
        window.history.replaceState(null, '', '/unlock');
      })
      .catch((e: Error) => {
        setStatus('error');
        setError(e.message);
      });
  }, []);

  // Android: Google sign-in finishes in a Custom Tab and comes back here.
  useEffect(() => {
    let stop = () => {};
    listenForAppSignIn((e) => {
      setStatus('error');
      setError(e.message);
    }).then((s) => (stop = s));
    return () => stop();
  }, []);

  // Signed in with Google but no key on this device yet: look up the purchase,
  // and if they were on their way to buy, carry on to checkout.
  useEffect(() => {
    if (!session || license || status === 'claiming' || checked.current === session.user.id) return;
    checked.current = session.user.id;
    setStatus('checking');
    fetchAccount(session)
      .then(async (a) => {
        if (a.license) return setStatus('idle');
        if (!wantsToBuy.current) return setStatus('unpaid');
        setStatus('checkout');
        window.history.replaceState(null, '', '/unlock');
        await startCheckout(session.access_token);
      })
      .catch((e: Error) => {
        setStatus('error');
        setError(e.message);
      });
  }, [session, license, status]);

  async function useKey(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/license/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key.trim()}` },
      });
      const data = (await r.json()) as { valid: boolean; email?: string; license?: string };
      if (!data.valid) throw new Error('That key or code is not valid.');
      // An access code comes back as a signed licence; a key is saved as typed.
      saveLicense(data.license ?? key.trim(), data.email);
      router.push('/study');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    await signOut();
    checked.current = null;
    setStatus('idle');
  }

  const message = {
    claiming: ['Confirming your payment…', 'This takes a second.'],
    checking: ['Checking your purchase…', 'One moment.'],
    checkout: ['Opening secure checkout…', 'Taking you to Stripe.'],
  } as const;
  if (status in message) {
    const [title, sub] = message[status as keyof typeof message];
    return (
      <main className="page">
        <div className="narrow card">
          <h1>{title}</h1>
          <p className="muted">{sub}</p>
        </div>
      </main>
    );
  }

  const who = session?.user.email ?? savedEmail();

  if (license) {
    return (
      <main className="page">
        <div className="narrow stack">
          <div className="card">
            <h1>{status === 'claimed' ? 'You’re in. Thank you!' : 'You have full access'}</h1>
            <p>
              {who ? <>Signed in as <b>{who}</b>. </> : null}
              To study on another device or in the Android app, sign in there with the same Google account.
            </p>
            <Link href="/study" className="btn btn-primary">Start studying</Link>
          </div>
          <details className="faq">
            <summary>Your licence key</summary>
            <p>A backup way in. It also unlocks access on another device.</p>
            <div className="keybox">{license}</div>
          </details>
          <button className="btn btn-ghost btn-sm" onClick={leave}>Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="narrow stack">
        {status === 'error' && (
          <div className="notice">
            <b>Something went wrong.</b> {error} If you were charged, sign in with the Google account you
            bought with, or contact support.
          </div>
        )}
        {session ? (
          <div className="card">
            <h1>No purchase yet</h1>
            <p>
              Signed in as <b>{session.user.email}</b>, but this account hasn’t bought full access.
              {IS_APP ? ' If you bought with a different Google account, sign in with that one.' : ''}
            </p>
            {!IS_APP && <BuyButton />}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={leave}>
              Use a different account
            </button>
          </div>
        ) : (
          <div className="card">
            <h1>Sign in</h1>
            <p className="muted">Use your Google account. Your purchase follows you to every device.</p>
            {AUTH_ENABLED ? <GoogleButton /> : <p className="err">Sign-in isn’t available right now.</p>}
          </div>
        )}
        <details className="faq">
          <summary>Have a licence key or access code?</summary>
          <form onSubmit={useKey} className="stack" style={{ marginTop: 12 }}>
            <input className="text" placeholder="Licence key or access code" value={key} onChange={(e) => setKey(e.target.value)} />
            <button className="btn btn-ghost" disabled={busy || !key.trim()}>Use key</button>
          </form>
          {error && status !== 'error' && <p className="err" style={{ marginTop: 10 }}>{error}</p>}
        </details>
        {!IS_APP && !session && (
          <p className="muted">
            Not a customer yet? <Link href="/sample">Try the free test</Link> or{' '}
            <Link href="/#pricing">get full access</Link>.
          </p>
        )}
      </div>
    </main>
  );
}
