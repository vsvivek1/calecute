import { requestedView } from '@/lib/supabase';
import { getSession, canAdminister } from '@/lib/session';
import SignIn from '@/components/SignIn';
import UserHome from '@/components/UserHome';
import AdminHome from '@/components/AdminHome';

export default async function Page() {
  const view = await requestedView();
  const session = await getSession();

  if (!session) return <SignIn view={view} />;

  if (view === 'admin') {
    // The host asked for the admin view; the role decides whether it is given.
    // Without this an ordinary user who learned the address would see the
    // shell — the queries would return nothing, but the refusal should be
    // plain rather than an empty table.
    if (!canAdminister(session)) {
      return (
        <>
          <h1>Not an admin account</h1>
          <p className="sub">
            You are signed in as {session.email}, which does not have admin
            access. If you are looking for your own subscription, it is at{' '}
            <a href={`https://${process.env.NEXT_PUBLIC_USER_HOST}`}>
              {process.env.NEXT_PUBLIC_USER_HOST}
            </a>
            .
          </p>
        </>
      );
    }
    return <AdminHome session={session} />;
  }

  return <UserHome session={session} />;
}
