import Link from 'next/link';
import type { User } from '@/lib/types';

export default function TopBar({ user, invite }: { user: User | null; invite: boolean }) {
  return (
    <header className="bar">
      <Link href="/" className="brand">
        <span className="logo">⚡</span>
        <span>
          <b>Recallio</b> <span className="tag">Energy Manager</span>
        </span>
      </Link>
      <span className="spacer" />
      {user && invite && (
        <Link className="btn btn-ghost btn-sm" href="/invite" title="Invite friends & get rewards">
          🎁 Invite
        </Link>
      )}
      {user && (
        <Link className="btn btn-ghost btn-sm" href="/papers">
          My papers
        </Link>
      )}
      {user && (
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost btn-sm" type="submit">Sign out</button>
        </form>
      )}
    </header>
  );
}
