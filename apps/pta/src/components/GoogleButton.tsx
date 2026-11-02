'use client';

import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';

export default function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    const { error } = await browserClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  return (
    <>
      {error && <div className="flash err">{error}</div>}
      <button className="btn btn-primary" onClick={go} disabled={busy} style={{ width: '100%' }}>
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>
    </>
  );
}
