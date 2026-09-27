import { Masthead } from "@/components/goldlelam/Masthead";
import { Footer } from "@/components/goldlelam/Footer";
import {
  GOLDLELAM,
  FEATURES,
  HOW_IT_WORKS,
  BANK_ONBOARDING,
} from "@/lib/goldlelam/content";

const SCREEN_CAPTIONS = [
  "Browse",
  "Lot photos",
  "Live bid",
  "Scan QR",
  "Watchlist",
];

export default function GoldLelamLanding() {
  return (
    <>
      <Masthead />

      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">For bank gold-loan auctions</span>
          <h1>{GOLDLELAM.tagline}</h1>
          <p className="lede">
            GoldLelam lets a bank list its gold-loan auctions and lets
            bidders browse lots, pay the earnest money deposit, and bid —
            all from a phone.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary" href="#how-it-works">
              See how it works
            </a>
            <a className="btn btn-secondary" href={BANK_ONBOARDING.ctaHref}>
              {BANK_ONBOARDING.ctaLabel}
            </a>
          </div>

          <div className="store-badges" aria-label="Coming soon to app stores">
            <span className="store-badge">
              <span>Coming soon on</span>
              <strong>Google Play</strong>
            </span>
            <span className="store-badge">
              <span>Coming soon on</span>
              <strong>App Store</strong>
            </span>
          </div>

          <div
            className="screens"
            role="list"
            aria-label="App screenshots — placeholders"
          >
            {SCREEN_CAPTIONS.map((caption) => (
              <div className="screen-placeholder" role="listitem" key={caption}>
                {caption}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="section-heading">
            <h2>What you get</h2>
            <p>Everything a bidder needs, nothing they don&apos;t.</p>
          </div>
          <div className="grid-4">
            {FEATURES.map((f) => (
              <div className="card" key={f.heading}>
                <h3>{f.heading}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block alt" id="how-it-works">
        <div className="wrap">
          <div className="section-heading">
            <h2>How auctions work</h2>
            <p>From listing to settlement, in four steps.</p>
          </div>
          <div className="steps">
            {HOW_IT_WORKS.map((s) => (
              <div className="step" key={s.step}>
                <span className="step-num">{s.step}</span>
                <div>
                  <h3>{s.heading}</h3>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <div className="cta-panel">
            <h2>{BANK_ONBOARDING.heading}</h2>
            <p>{BANK_ONBOARDING.body}</p>
            <a className="btn btn-primary" href={BANK_ONBOARDING.ctaHref}>
              {BANK_ONBOARDING.ctaLabel}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
