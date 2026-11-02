import Link from 'next/link';
import BuyButton from '@/components/BuyButton';
import Footer from '@/components/Footer';
import Redirect from '@/components/Redirect';
import { IS_APP, PRICE_LABEL } from '@/lib/env';

const FEATURES = [
  {
    icon: '◎',
    title: 'The app decides what you study',
    body: 'No topic lists, no choosing. Every question is picked for you: what you are about to forget, what you found tough, and new material weighted like the exam.',
  },
  {
    icon: '⏱',
    title: '10 questions at a time',
    body: 'Short sittings at the times you choose, with a reminder at each one. About 12 minutes, a few times a day, beats a weekend cram.',
  },
  {
    icon: '↻',
    title: 'Four honest ratings',
    body: 'After each answer, tap Didn’t get it, Tough, Understood or So simple. The FSRS spaced-repetition engine uses it to decide when the question comes back.',
  },
  {
    icon: '▦',
    title: 'Planned to your exam date',
    body: 'Set your test date and the daily quota works backwards from it. Nothing is scheduled after exam day, and the last two days switch to cram mode on their own.',
  },
  {
    icon: '✓',
    title: 'Reviewed by a PMP',
    body: 'Original situational questions written for the current exam mindset (servant leadership, agile and hybrid delivery) and checked by a PMP-certified project manager.',
  },
  {
    icon: '✎',
    title: 'Weekly report and timed mocks',
    body: 'Each week: what became easy, what is still tough and gets pushed again. When you have enough covered, a full timed mock shows up in your feed.',
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
    'Yes. A free 10-question sitting needs no sign-up. It works exactly like the full app: one question at a time, explanations, and the four ratings.',
  ],
  [
    'Why can’t I pick a topic or skip a question?',
    'Because choosing costs energy and we all quietly avoid the hard topics. The app picks for you, one card at a time, and a rating is the only way forward. That is what keeps short daily sittings effective.',
  ],
  [
    'How long does it take each day?',
    'You set your minutes per day. Most days are two or three sittings of about 12 minutes. Extra sets are allowed, spaced out, never back to back.',
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
            <h1>10 questions at a time. Ready by exam day.</h1>
            <p className="lead">
              Tell us your exam date and when you can study. The app picks every question, brings back what you are
              about to forget, and plans each day back from your test date. Original questions reviewed by a
              PMP-certified project manager. One payment of {PRICE_LABEL}.
            </p>
            <div className="cta">
              <Link href="/sample" className="btn btn-accent">Try a free sitting</Link>
              <a href="#features" className="btn btn-ghost">How it works</a>
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
            <div className="ratings" style={{ marginTop: 12 }}>
              <span className="rate rate-again">Didn’t get it</span>
              <span className="rate rate-hard">Tough</span>
              <span className="rate rate-good">Understood</span>
              <span className="rate rate-easy">So simple</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="wrap">
          <div className="section-head">
            <h2>Built for busy people, not study marathons</h2>
            <p>
              Most PMP candidates work full time. So there is one screen: your daily feed. Open it, answer the card in
              front of you, rate it, and the app takes care of the rest.
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
              for the full question bank, the daily plan, timed mocks and weekly reports, on web and Android.
            </p>
            <p className="muted">
              Not sure yet? <Link href="/sample">Try a free sitting</Link>, no email needed.
            </p>
          </div>
          <div className="price-card">
            <div className="price">
              {PRICE_LABEL} <small>one-time · USD</small>
            </div>
            <ul className="ticks">
              <li>Full original question bank, all three domains</li>
              <li>Daily plan worked back from your exam date</li>
              <li>10-question sittings with reminders at your study times</li>
              <li>FSRS spaced repetition, weekly report, 2-day cram mode</li>
              <li>Timed mock exams (60 or 180 questions)</li>
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
