import Link from 'next/link';
import BuyButton from '@/components/BuyButton';
import Footer from '@/components/Footer';
import Redirect from '@/components/Redirect';
import { IS_APP, PRICE_LABEL } from '@/lib/env';

const FEATURES = [
  {
    icon: '⏱',
    title: 'Full-length timed mocks',
    body: '180 questions in 230 minutes, weighted like the real exam across People, Process and Business Environment. Flag, navigate and review like test day.',
  },
  {
    icon: '↻',
    title: 'Spaced repetition',
    body: 'Every question you miss comes back tomorrow, then in 6 days, then further out. The SM-2 schedule keeps what you learn from fading before exam day.',
  },
  {
    icon: '◎',
    title: 'Weak-area drills',
    body: 'We track your accuracy topic by topic and build drills from the ones dragging your score down, so study time goes where it moves the needle.',
  },
  {
    icon: '✓',
    title: 'Reviewed by a PMP',
    body: 'Original situational questions written for the current exam mindset (servant leadership, agile and hybrid delivery) and checked by a PMP-certified project manager.',
  },
  {
    icon: '✎',
    title: 'Explanations that teach',
    body: 'Every answer explains why the best option wins and why the tempting distractor is wrong. That is how the PMI mindset sticks.',
  },
  {
    icon: '▣',
    title: 'Web and Android',
    body: 'Study in the browser or on your phone. Progress lives on your device and the question bank works offline once loaded.',
  },
];

const FAQ = [
  [
    'Is this a subscription?',
    `No. ${PRICE_LABEL} once, in US dollars, and you keep access. No renewals and nothing to cancel.`,
  ],
  [
    'Are these real PMI exam questions?',
    'No, and nobody legitimate can sell those. Every question is original, written in the style of the exam’s situational questions and reviewed by a PMP-certified project manager.',
  ],
  [
    'Does it cover agile and hybrid?',
    'Yes. Roughly half the bank is agile or hybrid, matching the exam’s emphasis, and every question is tagged so you can see how you do on each approach.',
  ],
  [
    'Can I try before I buy?',
    'Yes. The 15-question sample test is free and needs no sign-up. It uses the same engine and explanations as the full product.',
  ],
  [
    'How do I get in after paying?',
    'Stripe sends you straight back here with a licence key saved on your device. On another device, sign in with the email you paid with.',
  ],
  [
    'What if it isn’t for me?',
    'Email us within 14 days of purchase and we will refund you in full.',
  ],
];

export default function Landing() {
  if (IS_APP) return <Redirect to="/study" />;

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <span className="eyebrow">For the current PMP exam</span>
            <h1>Walk into the PMP knowing you’re ready.</h1>
            <p className="lead">
              Timed mock exams, spaced repetition and weak-area drills, built on original questions reviewed by
              a PMP-certified project manager. One payment of {PRICE_LABEL}. No subscription.
            </p>
            <div className="cta">
              <Link href="/sample" className="btn btn-accent">Take the free 15-question test</Link>
              <a href="#pricing" className="btn btn-ghost">See what’s included</a>
            </div>
          </div>
          <div className="hero-card" aria-hidden>
            <div className="qmeta">
              <span className="pill">People</span>
              <span className="pill">Agile</span>
            </div>
            <div className="q">
              Two senior developers disagree in every sprint planning about how to split stories, and the rest
              of the team has stopped contributing. What should the project manager do first?
            </div>
            <div className="opt">Ask the product owner to decide how stories are split</div>
            <div className="opt ok">Meet the two developers to understand the source of the disagreement</div>
            <div className="opt">Escalate the conflict to the developers’ functional manager</div>
            <div className="opt">Raise it at the retrospective so the whole team can vote</div>
            <div className="why">
              Servant leaders understand a conflict before acting on it. Escalating or handing it off skips that step.
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head">
            <h2>Study the way the exam tests you</h2>
            <p>
              The PMP rewards judgement, not memorisation. Every part of this is built to train the judgement
              and to show you exactly where yours is still off.
            </p>
          </div>
          <div className="grid3">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <div className="icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt" id="pricing">
        <div className="wrap grid2" style={{ alignItems: 'center' }}>
          <div>
            <h2>One price. Everything included.</h2>
            <p className="muted" style={{ fontSize: '1.08rem' }}>
              Most PMP courses charge monthly and bury the practice exams behind upgrades. This is one payment
              for the full question bank, unlimited mocks and every study mode, on web and Android.
            </p>
            <p className="muted">
              Not sure yet? <Link href="/sample">Try 15 questions free</Link>, no email needed.
            </p>
          </div>
          <div className="price-card">
            <div className="price">
              {PRICE_LABEL} <small>one-time · USD</small>
            </div>
            <ul className="ticks">
              <li>Full original question bank, all three domains</li>
              <li>Unlimited timed mock exams (60 or 180 questions)</li>
              <li>Spaced-repetition daily review</li>
              <li>Weak-area drills and topic-level progress</li>
              <li>Web and Android app</li>
              <li>14-day money-back guarantee</li>
            </ul>
            <BuyButton className="btn btn-accent btn-block" />
            <p className="fine" style={{ marginTop: 12 }}>
              Secure checkout by Stripe. Already paid? <Link href="/unlock">Sign in</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="narrow">
          <h2>Questions</h2>
          {FAQ.map(([q, a]) => (
            <details className="faq" key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
