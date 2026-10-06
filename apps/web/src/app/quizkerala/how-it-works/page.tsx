import Link from "next/link";
import { PageShell } from "@/components/quizkerala/PageShell";
import { PLAYER_STEPS, QUIZKERALA } from "@/lib/quizkerala/content";

export const metadata = { title: "How it works" };

export default function HowItWorks() {
  return (
    <PageShell
      path="/quizkerala/how-it-works"
      title="How it works"
      intro="One Google sign-in, one code, one fair attempt against the clock."
    >
      <div className="prose">
        <h2>For players</h2>
        <ol className="steps" style={{ marginTop: "1.25rem" }}>
          {PLAYER_STEPS.map((s, i) => (
            <li className="step" key={s.heading}>
              <span className="step-num">{i + 1}</span>
              <div>
                <h3>{s.heading}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2>The clock</h2>
        <p>
          Your time starts when you tap Start, not when the quiz opens. Your
          deadline is whichever comes first: your start time plus the quiz&apos;s
          time limit, or the moment the quiz closes. The countdown on your
          screen is a guide; our server keeps the official time, so changing
          your phone&apos;s clock does nothing.
        </p>

        <h2>Questions</h2>
        <p>
          In a <strong>fixed</strong> quiz every player gets the same questions
          in the same order. In a <strong>random</strong> quiz each player gets
          a set drawn from a larger question bank when they start, and the
          option order may be shuffled too. Reloading the page always shows
          you the same set you started with.
        </p>

        <h2>Scoring and ranking</h2>
        <ul>
          <li>+1 for each correct answer. No negative marking.</li>
          <li>Higher score ranks higher.</li>
          <li>Equal scores: less time taken ranks higher.</li>
          <li>Equal score and time: the earlier submission ranks higher.</li>
          <li>Exactly equal on all three: you share the rank.</li>
        </ul>

        <h2>Provisional and Final</h2>
        <p>
          While a quiz is open its leaderboard is <strong>Provisional</strong>,
          and an organiser may choose to hide it until the end. When the quiz
          closes, unfinished attempts are scored on what was saved and the
          board becomes <strong>Final</strong>. It never changes after that,
          and you can review the correct answers.
        </p>

        <p style={{ marginTop: "2rem" }}>
          <a className="btn btn-primary" href={QUIZKERALA.appUrl}>
            Play now
          </a>{" "}
          <Link className="btn btn-secondary" href="/quizkerala/faq">
            Read the FAQ
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
