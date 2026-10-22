import { redirect } from 'next/navigation';

import { getMe, home } from '@/lib/session';

export const metadata = { title: 'Almost there' };

/** Signed in, but no school has this email on file yet. */
export default async function Welcome() {
  const me = await getMe();
  if (!me) redirect('/signin');
  if (home(me) !== '/welcome') redirect(home(me));
  return (
    <div className="auth-panel" style={{ minHeight: '100vh' }}>
      <div className="signin card">
        <h1>You’re signed in, but no school has this email yet</h1>
        <p className="sub">
          You signed in as <strong>{me.email}</strong>. Schools add parents by email address, so ask
          the school office to add this exact address to your child’s record. It will show up here
          the next time you open the app; there is nothing else to install or enter.
        </p>
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost">Sign in with a different account</button>
        </form>
      </div>
    </div>
  );
}
