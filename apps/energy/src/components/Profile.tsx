'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase-browser';
import type { Exam, Feed, Paper, User } from '@/lib/types';
import Settings from './Settings';
import { AlertsToggle } from './Alerts';

export default function Profile({
  user,
  exam,
  settings,
  papers,
}: {
  user: User;
  exam: Exam;
  settings: Feed['settings'];
  papers: Paper[];
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteData() {
    setBusy(true);
    setError(null);
    const { error } = await browserClient().rpc('em_delete_me');
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    await fetch('/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <p className="note">
        <Link href="/">← Back to today</Link>
      </p>
      <h1>{user.name ?? 'Your profile'}</h1>
      <p className="sub">{user.email}</p>

      <section className="card">
        <h2>My papers</h2>
        <ul className="plain">
          {papers.map((p) => (
            <li key={p.id}>
              Paper {p.id} · {p.name}
            </li>
          ))}
        </ul>
        <Link className="btn btn-ghost btn-sm" href="/papers">
          Add or drop papers
        </Link>
      </section>

      <section className="card">
        <h2>My plan</h2>
        <Settings exam={exam} initial={settings} submitLabel="Save" onSaved={() => router.refresh()} />
      </section>

      <section className="card">
        <h2>Alerts</h2>
        <p className="note">
          Recallio alerts you at each study time while this site (or the installed app) is open. No alerts from
          9:30 PM to 6:30 AM.
        </p>
        <AlertsToggle />
      </section>

      <section className="card">
        <h2>Account</h2>
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost" type="submit">
            Sign out
          </button>
        </form>
        <p className="note" style={{ marginTop: 16 }}>
          <a href="https://calecutech.com/privacy">Privacy</a> · <a href="https://calecutech.com/terms">Terms</a> ·{' '}
          <a href="https://calecutech.com/contact">Help</a> ·{" "}
          <a href="https://calecutech.com/data-deletion">Data deletion</a>
        </p>
        {error && <div className="err">{error}</div>}
        {!confirm ? (
          <button className="link danger" onClick={() => setConfirm(true)}>
            Delete my Energy Manager data
          </button>
        ) : (
          <div className="confirm">
            <p>
              This deletes your papers, progress and plan for Energy Manager. It cannot be undone. Your Google
              sign-in stays, because other Calecute apps use it.
            </p>
            <button className="btn danger-btn" disabled={busy} onClick={deleteData}>
              {busy ? 'Deleting…' : 'Yes, delete everything'}
            </button>{' '}
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>
              Keep my data
            </button>
          </div>
        )}
      </section>
    </>
  );
}
