import Link from "next/link";
import { Masthead } from "@/components/quizkerala/Masthead";
import { Footer } from "@/components/quizkerala/Footer";
import { JoinForm } from "@/components/quizkerala/JoinForm";
import { PlayBadge } from "@/components/quizkerala/PlayBadge";
import {
  FEATURES,
  PLAYER_STEPS,
  QUIZKERALA,
} from "@/lib/quizkerala/content";

const OPTIONS = [
  "Thiruvananthapuram",
  "Kozhikode",
  "Kochi",
  "Thrissur",
];

export default function QuizKeralaHome() {
  return (
    <>
      <Masthead current="/quizkerala" />

      <main id="main">
        <section className="hero">
          <div className="wrap">
            <div>
              <span className="eyebrow">Free online quizzes for Kerala</span>
              <h1>
                Answer fast. <span className="accent">Rank first.</span>
              </h1>
              <p className="lede">
                QuizKerala runs timed quizzes for schools, clubs, colleges and
                friends. Sign in with Google, join with a code, and race the
                clock. Same score? The faster player wins.
              </p>

              <div className="hero-actions">
                <a className="btn btn-primary" href={QUIZKERALA.appUrl}>
                  Play now
                </a>
                <Link className="btn btn-secondary" href="/quizkerala/how-it-works">
                  How it works
                </Link>
              </div>

              <JoinForm />

              <div className="hero-actions">
                <PlayBadge />
              </div>
            </div>

            <div className="phone" aria-hidden="true">
              <div className="phone-screen">
                <div className="phone-top">
                  <div style={{ opacity: 0.85 }}>Kerala GK · Question 4 of 10</div>
                  <div className="timer">03:42</div>
                </div>
                <div className="phone-body">
                  <div className="phone-q">
                    Which city is the capital of Kerala?
                  </div>
                  {OPTIONS.map((o, i) => (
                    <div key={o} className={`phone-opt${i === 0 ? " picked" : ""}`}>
                      {String.fromCharCode(65 + i)}. {o}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="section-heading">
              <h2>Built for fair, fast quizzes</h2>
              <p>Everything an organiser needs to run a quiz, and nothing that gets in a player&apos;s way.</p>
            </div>
            <div className="grid-3">
              {FEATURES.map((f) => (
                <div className="card" key={f.heading}>
                  <span className="icon" aria-hidden="true">{f.icon}</span>
                  <h3>{f.heading}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="block alt">
          <div className="wrap">
            <div className="section-heading">
              <h2>Play in five steps</h2>
              <p>From a shared link to your rank on the board.</p>
            </div>
            <ol className="steps">
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
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="stats">
              <div className="stat"><strong>1</strong><span>attempt per player</span></div>
              <div className="stat"><strong>0</strong><span>negative marking</span></div>
              <div className="stat"><strong>₹0</strong><span>to play</span></div>
              <div className="stat"><strong>360px</strong><span>phones welcome</span></div>
            </div>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <div className="cta-panel">
              <h2>Running a quiz for your school or club?</h2>
              <p>
                Build a question bank, pick fixed or random questions, set the
                timer and share one code. We handle the clock and the ranking.
              </p>
              <Link className="btn btn-gold" href="/quizkerala/organisers">
                For organisers
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
