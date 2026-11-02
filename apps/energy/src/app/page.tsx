import { getCatalog, getFlash, getMe, getToday, getUser } from '@/lib/data';
import { referralEnabled } from '@/lib/referral';
import Enrol from '@/components/Enrol';
import FlashBanner from '@/components/FlashBanner';
import SignIn from '@/components/SignIn';
import Study from '@/components/Study';
import type { Flash } from '@/lib/types';

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
    return (
      <>
        <section className="hero">
          <p className="eyebrow">BEE National Certification Examination</p>
          <h1>Energy Manager &amp; Energy Auditor, one day at a time</h1>
          <p className="sub">
            Enrol in the papers you need. Each day Recallio gives you new cards, solved problems
            step by step, and the revision that is due. You never plan; you just start.
          </p>
          {error && <div className="err">{error}</div>}
          <SignIn refCode={ref ?? null} />
        </section>
        <section className="grid4">
          {[
            ['Daily cards', 'Short facts and formulas from the BEE syllabus and past papers.'],
            ['Step-by-step problems', 'Long numericals one step at a time, with "Explain more" when you need it.'],
            ['Built-in revision', 'Spaced repetition brings each card back just before you would forget it.'],
            ['Noon flash', 'One or two high-yield facts per paper at 12 noon IST.'],
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
    return <Enrol catalog={catalog} initial={[]} first name={user.name} />;
  }

  const today = await getToday();
  return (
    <>
      <FlashBanner flash={flash} />
      {referralEnabled() && (
        <a className="invite-strip" href="/invite">
          🎁 Invite friends &amp; get rewards <span>Invite now →</span>
        </a>
      )}
      <Study today={today} catalog={catalog} name={user.name} />
    </>
  );
}
