import { redirect } from 'next/navigation';

import { demoSignIn } from '@/app/actions';
import GoogleButton from '@/components/GoogleButton';
import { DEMO, DEMO_PEOPLE } from '@/lib/mode';
import { getMe, home } from '@/lib/session';

export const metadata = { title: 'Sign in' };

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const me = await getMe();
  if (me) redirect(home(me));
  const { error } = await searchParams;

  return (
    <div className="signin">
      <div className="brand" style={{ fontSize: 20, marginBottom: 18 }}>
        <span className="dot">P</span> Calecutech PTA
      </div>
      <h1>Your child’s school day, in one place</h1>
      <p className="sub">
        Attendance, homework, fees, marks, activities and complaints. The same account works in the
        Android and iPhone app.
      </p>
      {error && <div className="flash err">{error}</div>}

      {DEMO ? (
        <>
          <div className="flash ok">
            This is a demo with a sample school. Pick who to look around as; nothing here is real and
            it resets from time to time.
          </div>
          <form action={demoSignIn}>
            {DEMO_PEOPLE.map((p) => (
              <button key={p.email} name="email" value={p.email} className="person">
                <span className="grow">
                  <strong>{p.label}</strong>
                  <br />
                  <span className="who">{p.who}</span>
                </span>
                <span aria-hidden>→</span>
              </button>
            ))}
          </form>
        </>
      ) : (
        <div className="card">
          <GoogleButton />
          <p className="small muted" style={{ marginTop: 14 }}>
            Use the email address you gave the school. If you see nothing after signing in, ask the
            school office to add that address to your child’s record.
          </p>
        </div>
      )}
    </div>
  );
}
