import { serverClient } from '@/lib/supabase';
import type { Session } from '@/lib/types';
import PayButton from './PayButton';

const DEFAULT_FREE_LIMIT = 200;

export default async function UserHome({
  session,
  focusCourse,
}: {
  session: Session;
  focusCourse?: string | null;
}) {
  const supabase = await serverClient();

  // RLS restricts all three of these to the signed-in user, so no user filter
  // is written here — the database applies it and a client-side filter would
  // only be decoration.
  const [{ data: profile }, { data: subscriptions }, { data: courses }, { count }] =
    await Promise.all([
      supabase
        .from('user_profile')
        .select('course_id, free_card_limit, free_tier_unlimited')
        .maybeSingle(),
      supabase
        .from('subscriptions')
        .select('course_id, provider, status, current_period_end')
        .in('status', ['active', 'in_grace', 'cancelled']),
      supabase
        .from('courses')
        .select('id, name, code, price_minor, price_currency'),
      supabase
        .from('user_card_state')
        .select('card_id', { count: 'exact', head: true }),
    ]);

  const seen = count ?? 0;
  const unlimited = profile?.free_tier_unlimited ?? false;
  const limit = unlimited ? null : profile?.free_card_limit ?? DEFAULT_FREE_LIMIT;
  const owned = new Set((subscriptions ?? []).map((s) => s.course_id));

  return (
    <>
      <h1>Your account</h1>
      <p className="sub">{session.email}</p>

      <div className="card">
        <h2>Free cards</h2>
        {unlimited ? (
          <p>
            <span className="pill pill-comp">Complimentary</span>{' '}
            Every course is unlocked on this account, with no payment.
          </p>
        ) : (
          <p>
            You have studied <strong>{seen}</strong> of your{' '}
            <strong>{limit}</strong> free cards.
            {seen >= (limit ?? 0) && ' Subscribe to keep going.'}
          </p>
        )}
        <p className="note">
          Reviews of cards you already have continue for ever, whether or not
          you subscribe. Your streak and progress are never reset.
        </p>
      </div>

      {[...(courses ?? [])]
        .sort((a, b) => Number(b.id === focusCourse) - Number(a.id === focusCourse))
        .map((course) => {
        const hasSub = owned.has(course.id) || unlimited;
        const sub = (subscriptions ?? []).find((s) => s.course_id === course.id);
        return (
          <div className="card" key={course.id} id={course.id}>
            {course.id === focusCourse && !hasSub && (
              <p className="note">You came here to buy this course.</p>
            )}
            <h2>{course.name}</h2>
            <p className="note" style={{ marginTop: -6 }}>{course.code}</p>

            {hasSub ? (
              <p>
                <span className="pill pill-paid">Unlocked</span>{' '}
                {sub
                  ? `Paid with ${sub.provider === 'play' ? 'Google Play' : sub.provider === 'admin' ? 'a complimentary grant' : 'UPI or card'}`
                  : 'Complimentary access'}
                {sub?.current_period_end
                  ? ` · until ${new Date(sub.current_period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ''}
              </p>
            ) : (
              <>
                <p>
                  <span className="pill pill-free">Free tier</span> Unlock every
                  card in this course, scheduled day by day through to your exam
                  date.
                </p>
                <PayButton
                  courseId={course.id}
                  courseName={course.name}
                  priceMinor={course.price_minor}
                  currency={course.price_currency ?? 'INR'}
                  email={session.email ?? ''}
                  name={session.name ?? ''}
                />
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
