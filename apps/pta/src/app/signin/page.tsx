import { redirect } from 'next/navigation';

import { demoSignIn } from '@/app/actions';
import GoogleButton from '@/components/GoogleButton';
import Icon from '@/components/Icon';
import { Logo } from '@/components/Shell';
import { DEMO, DEMO_PEOPLE } from '@/lib/mode';
import { getMe, home } from '@/lib/session';

export const metadata = { title: 'Sign in' };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await getMe();
  if (me) redirect(home(me));
  const { error } = await searchParams;

  return (
    <div className="auth">
      <section className="auth-art">
        <div className="brand">
          <Logo />
          <span className="brand-text">
            <strong>Calecutech PTA</strong>
            <small>Parent–Teacher Association</small>
          </span>
        </div>
        <div>
          <h1>Your child’s school day, in one place</h1>
          <p>
            Attendance, homework, fees, marks, activities and complaints. The same account works in
            the Android and iPhone app.
          </p>
          <div className="features" aria-hidden>
            <span><Icon name="calendar" size={18} />Daily attendance</span>
            <span><Icon name="book" size={18} />Homework</span>
            <span><Icon name="wallet" size={18} />Fees &amp; receipts</span>
            <span><Icon name="chart" size={18} />Marks &amp; grades</span>
          </div>
        </div>
        <div className="foot">English · മലയാളം</div>
      </section>

      <section className="auth-panel">
        <div className="signin">
          <h2>{DEMO ? 'Look around the demo' : 'Sign in'}</h2>
          <p className="sub">
            {DEMO ? 'A sample school. Pick who to look around as.' : 'Use the email address you gave the school.'}
          </p>
          {error && <div className="flash err">{error}</div>}

          {DEMO ? (
            <>
              <form action={demoSignIn}>
                {DEMO_PEOPLE.map((p, i) => (
                  <button key={p.email} name="email" value={p.email} className="person">
                    <span className={`icon-chip ${['', 'green', 'violet'][i] ?? ''}`}>
                      <Icon name={(['users', 'clipboard', 'grid'] as const)[i] ?? 'users'} />
                    </span>
                    <span className="grow">
                      <strong>{p.label}</strong>
                      <br />
                      <span className="who">{p.who}</span>
                    </span>
                    <Icon name="arrow" size={18} className="go" />
                  </button>
                ))}
              </form>
              <p className="small muted" style={{ marginTop: 14 }}>
                Nothing here is real and it resets from time to time.
              </p>
            </>
          ) : (
            <div className="card">
              <GoogleButton />
              <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
                If you see nothing after signing in, ask the school office to add that address to
                your child’s record.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
