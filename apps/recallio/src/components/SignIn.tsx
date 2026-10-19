'use client';

import { useState } from 'react';
import { browserClient } from '@/lib/supabase-browser';
import type { View } from '@/lib/types';

export default function SignIn({ view, course }: { view: View; course?: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    const supabase = browserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback${course ? `?course=${encodeURIComponent(course)}` : ''}` },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  return (
    <>
      <h1>{view === 'admin' ? 'Recallio admin' : 'Your Recallio account'}</h1>
      <p className="sub">
        {view === 'admin'
          ? 'Sign in with the Google account that holds admin access.'
          : 'Sign in with the same Google account you use in the app.'}
      </p>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <button className="btn btn-primary" onClick={signIn} disabled={busy}>
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </button>
        <p className="note" style={{ marginTop: 14 }}>
          Your progress and subscription belong to the account, so signing in
          here shows exactly what the app shows.
        </p>
      </div>
    </>
  );
}
