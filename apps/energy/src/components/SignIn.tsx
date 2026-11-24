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
    const supabase = browserClient();
    // Drop any stale saved session first. If an old session's refresh fails
    // while Google sign-in is starting, the client tears that session down and
    // deletes the PKCE verifier cookie it has just written, so the callback
    // fails with "PKCE code verifier not found in storage". Clearing it before
    // the flow starts removes that race. Sign-in is only shown when signed out.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    const { error } = await supabase.auth.signInWithOAuth({
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
