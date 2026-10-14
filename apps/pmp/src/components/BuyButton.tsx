'use client';

import { useState } from 'react';
import { PRICE_LABEL } from '@/lib/env';

export default function BuyButton({ className = 'btn btn-accent', label }: { className?: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch('/api/checkout', { method: 'POST' });
      const data = (await r.json()) as { url?: string };
      if (!r.ok || !data.url) throw new Error();
      window.location.href = data.url;
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
