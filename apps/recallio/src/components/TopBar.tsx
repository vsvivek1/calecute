import Link from 'next/link';
import type { Session, View } from '@/lib/types';
import { canSwitchViews } from '@/lib/session';

const USER_HOST = process.env.NEXT_PUBLIC_USER_HOST ?? 'user.recallio.calecutech.com';
const ADMIN_HOST = process.env.NEXT_PUBLIC_ADMIN_HOST ?? 'superuser.recallio.calecutech.com';

export default function TopBar({
  view,
  session,
}: {
  view: View;
  session: Session | null;
}) {
  return (
    <div className="bar">
      <span className="name">Recallio</span>
      <span className="tag">{view === 'admin' ? 'Admin' : 'Account'}</span>
      <span className="spacer" />

      {/* Only a superuser sees the switch. An ordinary admin has one view and
          an ordinary user has no idea the other exists. */}
      {canSwitchViews(session) && (
        <a
          className="btn btn-ghost btn-sm"
          href={`https://${view === 'admin' ? USER_HOST : ADMIN_HOST}`}
        >
          {view === 'admin' ? 'View as user' : 'Admin view'}
        </a>
      )}

      {session ? (
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost btn-sm" type="submit">
            Sign out
          </button>
        </form>
      ) : (
        <Link className="btn btn-ghost btn-sm" href="/">
          Sign in
        </Link>
      )}
    </div>
  );
}
