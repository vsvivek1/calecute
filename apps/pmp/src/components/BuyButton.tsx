'use client';

import { useState } from 'react';
import { AUTH_ENABLED, signInWithGoogle, supabase } from '@/lib/auth';
import { PRICE_LABEL } from '@/lib/env';

/** Signs the buyer in with Google if needed, then opens Stripe checkout. */
export default function BuyButton({ className = 'btn btn-accent', label }: { className?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      if (!AUTH_ENABLED) throw new Error();
      const { data } = await supabase().auth.getSession();
      if (!data.session) {
        // Comes back to /unlock?buy=1, which continues to checkout.
        await signInWithGoogle('/unlock?buy=1');
        return;
      }
      await startCheckout(data.session.access_token);
    } catch {
      setError('Checkout could not start. Please try again.');
      setBusy(false);
    }
  }

  return (
    <>
      <button className={className} onClick={buy} disabled={busy}>
        {busy ? 'Opening secure checkout…' : (label ?? `Get full access: ${PRICE_LABEL}`)}
      </button>
      {error && <p className="err" style={{ marginTop: 8 }}>{error}</p>}
    </>
  );
}

export async function startCheckout(accessToken: string) {
  const r = await fetch('/api/checkout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
  const data = (await r.json()) as { url?: string };
  if (!r.ok || !data.url) throw new Error('Checkout could not start. Please try again.');
  window.location.href = data.url;
}
