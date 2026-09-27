import { serverClient } from '@/lib/supabase';
import type { ManagedUser, Session } from '@/lib/types';
import UserRow from './UserRow';

export default async function AdminHome({ session }: { session: Session }) {
  const supabase = await serverClient();

  // These queries only return other people's rows because the signed-in user
  // is an admin — the policy checks the role, not the page.
  const [{ data: profiles, error }, { data: subs }] = await Promise.all([
    supabase
      .from('user_profile')
      .select(
        'user_id, email, display_name, course_id, free_card_limit, free_tier_unlimited',
      )
      .order('email'),
    supabase
      .from('subscriptions')
      .select('user_id, provider, status')
      .in('status', ['active', 'in_grace', 'cancelled']),
  ]);

  if (error) {
    return (
      <>
        <h1>Admin</h1>
        <div className="err">Could not load accounts: {error.message}</div>
      </>
    );
  }

  const paid = new Set(
    (subs ?? [])
      .filter((s) => s.provider !== 'admin')
      .map((s) => s.user_id as string),
  );

  const users: ManagedUser[] = (profiles ?? []).map((p) => ({
    user_id: p.user_id as string,
    email: p.email as string | null,
    display_name: p.display_name as string | null,
    course_id: p.course_id as string | null,
    free_card_limit: p.free_card_limit as number | null,
    free_tier_unlimited: p.free_tier_unlimited as boolean,
    cards_seen: 0,
    has_paid_subscription: paid.has(p.user_id as string),
  }));

  return (
    <>
      <h1>Accounts</h1>
      <p className="sub">
        {users.length} account{users.length === 1 ? '' : 's'} · signed in as{' '}
        {session.email} ({session.role})
      </p>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Status</th>
              <th style={{ width: 150 }}>Free cards</th>
              <th style={{ width: 210 }}>Complimentary</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow key={user.user_id} user={user} />
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="note">No accounts yet. They appear after first sign-in.</p>
        )}
      </div>

      <p className="note">
        Changing the free card allowance affects only new cards. Nobody ever
        loses study progress, a streak, or a card they have already seen.
        Complimentary access is recorded as a subscription and can be revoked;
        Google Play and Razorpay subscriptions cannot be edited here, because
        those are written only by verified payment webhooks.
      </p>
    </>
  );
}
