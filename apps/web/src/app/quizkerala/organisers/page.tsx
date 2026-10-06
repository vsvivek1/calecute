import { PageShell } from "@/components/quizkerala/PageShell";
import { CONTACT, ORGANISER_STEPS } from "@/lib/quizkerala/content";

export const metadata = { title: "For organisers" };

const USES = [
  { heading: "Schools", body: "Class tests, house quizzes and GK weeks, with the same paper for everyone or a fresh set per student." },
  { heading: "Clubs and libraries", body: "Weekend quiz nights and Onam or Kerala Piravi specials, open to anyone with the link." },
  { heading: "Colleges and coaching", body: "Timed mock rounds for competitive exams, ranked by score and speed." },
  { heading: "Offices and events", body: "Ice-breakers and contest rounds that finish and announce winners in minutes." },
];

export default function Organisers() {
  return (
    <PageShell
      path="/quizkerala/organisers"
      title="For organisers"
      intro="Run a timed quiz for a class, a club or a whole district, and get a fair leaderboard without marking a single sheet."
    >
      <div className="prose" style={{ maxWidth: "none" }}>
        <ol className="steps">
          {ORGANISER_STEPS.map((s, i) => (
            <li className="step" key={s.heading}>
              <span className="step-num">{i + 1}</span>
              <div>
                <h3>{s.heading}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 style={{ textAlign: "center", marginTop: "3rem" }}>Who uses it</h2>
        <div className="grid-3" style={{ marginTop: "1.25rem" }}>
          {USES.map((u) => (
            <div className="card" key={u.heading}>
              <h3>{u.heading}</h3>
              <p>{u.body}</p>
            </div>
          ))}
        </div>

        <div className="cta-panel" style={{ marginTop: "3rem" }}>
          <h2>Get organiser access</h2>
          <p>
            Tell us who you are and roughly how many players you expect. We
            will set up your organiser account.
          </p>
          <a
            className="btn btn-gold"
            href={`mailto:${CONTACT.email}?subject=QuizKerala organiser access`}
          >
            Request access
          </a>
        </div>
      </div>
    </PageShell>
  );
}
