'use client';

import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';

export default function SignIn({ refCode }: { refCode: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    const ref = refCode && /^[A-Za-z0-9-]{3,40}$/.test(refCode) ? `?ref=${encodeURIComponent(refCode)}` : '';
    const { error } = await browserClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback${ref}` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  return (
    <div>
      {error && <div className="err">{error}</div>}
      <button className="btn btn-primary btn-lg" onClick={signIn} disabled={busy}>
        {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>
    </div>
  );
}
