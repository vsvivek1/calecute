import { getCatalog, getExam, getFeed, getFlash, getMe, getUser } from '@/lib/data';
import { referralEnabled } from '@/lib/referral';
import Enrol from '@/components/Enrol';
import FlashBanner from '@/components/FlashBanner';
import SignIn from '@/components/SignIn';
import Feed from '@/components/Feed';
import type { Exam, Flash } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * One screen, three states: signed out (what this is + sign in), signed in
 * but not enrolled (pick papers), enrolled (today's plan). The student never
 * chooses what to study; the engine does.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; error?: string }>;
}) {
  const { ref, error } = await searchParams;
  const user = await getUser();
  const flash = await getFlash().catch(() => [] as Flash[]);

  if (!user) {
    const exam = await getExam().catch(() => null as Exam | null);
    return (
      <>
        <section className="hero">
          <p className="eyebrow">BEE National Certification Examination</p>
          <h1>Energy Manager &amp; Energy Auditor, one day at a time</h1>
          <p className="sub">
            Tick the papers you need. Recallio plans every day back from your exam date: short
            sittings of up to 10 cards at your study times, solved problems one step at a time, and
            revision that comes back just before you would forget. You never plan; you just rate.
          </p>
          {exam && (
            <p className="note">
              {exam.name}: {new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {exam.status === 'estimated' ? ' (estimated, not yet announced)' : ''}.
            </p>
          )}
          {error && <div className="err">{error}</div>}
          <SignIn refCode={ref ?? null} />
        </section>
        <section className="grid4">
          {[
            ['Planned from your exam date', 'Every card is seen before the exam; the last two days switch to cram mode.'],
            ['Short sittings at set times', 'Up to 10 cards, a few minutes, at the times you choose.'],
            ['Step-by-step problems', 'Long numericals one step at a time, with "Explain" when you need it.'],
            ['Built-in revision', 'Rate each card; tough ones come back sooner, simple ones much later.'],
          ].map(([t, d]) => (
            <div className="card mini" key={t}>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </section>
        {flash.length > 0 && <FlashBanner flash={flash} preview />}
      </>
    );
  }

  const [me, catalog] = await Promise.all([getMe(), getCatalog()]);
  const enrolled = me.signedIn ? me.enrolled : [];
  if (enrolled.length === 0) {
    const exam = await getExam().catch(() => null);
    return <Enrol catalog={catalog} initial={[]} first name={user.name} exam={exam} />;
  }

  const feed = await getFeed();
  return (
    <Feed initial={feed} catalog={catalog} flash={flash} invite={referralEnabled()} name={user.name} />
  );
}
