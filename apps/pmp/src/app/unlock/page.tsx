'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API, IS_APP } from '@/lib/env';
import { clearLicense, postJson, saveLicense, savedEmail, useLicense } from '@/lib/store';

type Claim = { license: string; email: string };

export default function UnlockPage() {
  const router = useRouter();
  const license = useLicense();
  const [status, setStatus] = useState<'idle' | 'claiming' | 'claimed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);

  // Back from Stripe: swap the paid session for a licence key.
  useEffect(() => {
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

  async function restore(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const c = await postJson<Claim>('/api/license/restore', { email });
      saveLicense(c.license, c.email);
      router.push('/study');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function useKey(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/api/license/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key.trim()}` },
      });
      const data = (await r.json()) as { valid: boolean; email?: string };
      if (!data.valid) throw new Error('That licence key is not valid.');
      saveLicense(key.trim(), data.email);
      router.push('/study');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'claiming') {
    return (
      <main className="page">
        <div className="narrow card">
          <h1>Confirming your payment…</h1>
          <p className="muted">This takes a second.</p>
        </div>
      </main>
    );
  }

  if (license) {
    return (
      <main className="page">
        <div className="narrow stack">
          <div className="card">
            <h1>{status === 'claimed' ? 'You’re in. Thank you!' : 'You have full access'}</h1>
            <p>
              Your access is saved on this device{savedEmail() ? <> for <b>{savedEmail()}</b></> : null}. To
              use another device or the Android app, sign in there with the same email.
            </p>
            <Link href="/study" className="btn btn-primary">Start studying</Link>
          </div>
          <details className="faq">
            <summary>Your licence key</summary>
            <p>Keep this somewhere safe. It also unlocks access on another device.</p>
            <div className="keybox">{license}</div>
          </details>
          <button className="btn btn-ghost btn-sm" onClick={() => clearLicense()}>Sign out of this device</button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="narrow stack">
        {status === 'error' && (
          <div className="notice">
            <b>We couldn’t confirm that payment.</b> {error} If you were charged, sign in below with your email.
          </div>
        )}
        <div className="card">
          <h1>Sign in</h1>
          <p className="muted">Use the email you paid with.</p>
          <form onSubmit={restore} className="stack">
            <input
              className="text"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? 'Checking…' : 'Sign in'}
            </button>
          </form>
          {error && status !== 'error' && <p className="err" style={{ marginTop: 10 }}>{error}</p>}
        </div>
        <details className="faq">
          <summary>Have a licence key instead?</summary>
          <form onSubmit={useKey} className="stack" style={{ marginTop: 12 }}>
            <input className="text" placeholder="PMP1.…" value={key} onChange={(e) => setKey(e.target.value)} />
            <button className="btn btn-ghost" disabled={busy || !key.trim()}>Use key</button>
          </form>
        </details>
        {!IS_APP && (
          <p className="muted">
            Not a customer yet? <Link href="/sample">Try the free test</Link> or{' '}
            <Link href="/#pricing">get full access</Link>.
          </p>
        )}
      </div>
    </main>
  );
}
