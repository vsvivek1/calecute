import Link from 'next/link';
import type { User } from '@/lib/types';

/** App bar: brand, the referral gift icon and the profile button. Nothing else. */
export default function TopBar({ user, invite }: { user: User | null; invite: boolean }) {
  const initial = (user?.name ?? user?.email ?? '?').trim().charAt(0).toUpperCase();
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
        <Link className="iconbtn" href="/invite" title="Invite friends & get rewards" aria-label="Invite friends">
          🎁
        </Link>
      )}
      {user && (
        <Link className="iconbtn avatar" href="/profile" title="Profile" aria-label="Profile">
          {initial}
        </Link>
      )}
    </header>
  );
}
