import Link from "next/link";
import { JewelMount } from "@/components/bankers-gold/JewelMount";
import { StoreBadges } from "@/components/bankers-gold/StoreBadges";
import {
  BANKERS_GOLD,
  BANK_ONBOARDING,
  CONTACT,
  FEATURES,
  LEGAL_LINKS,
  STEPS,
  company,
} from "@/lib/bankers-gold/content";

const FEATURE_ICONS = ["◎", "₹", "⌗", "♡"];

export default function BankersGoldPage() {
  return (
    <>
      <section className="hero">
        <header className="nav wrap">
          <Link href={BANKERS_GOLD.path} className="brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/bankers-gold/icon.png" alt="" width={36} height={36} />
            {BANKERS_GOLD.name}
          </Link>
          <nav aria-label={BANKERS_GOLD.name}>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#banks">For banks</a>
            <a className="nav-cta" href={BANKERS_GOLD.playStoreUrl} target="_blank" rel="noopener">
              Get the app
            </a>
          </nav>
        </header>

        <div className="hero-grid wrap">
          <div className="hero-copy">
            <span className="eyebrow">Bank gold-loan auctions</span>
            <h1>
              Bank gold auctions,{" "}
              <span className="shine">beautifully simple.</span>
            </h1>
            <p className="lede">
              Browse the gold your bank is auctioning, pay the earnest money
              deposit, and bid live, all from your phone.
            </p>
            <StoreBadges />
            <p className="hero-note">Sign in with Google. Free to download.</p>
          </div>
          <JewelMount />
        </div>
      </section>

      <main>
        <section className="block" id="features">
          <div className="wrap">
            <div className="heading">
              <span className="eyebrow dark">What you get</span>
              <h2>Every lot, in your pocket</h2>
            </div>
            <div className="cards">
              {FEATURES.map((f, i) => (
                <article className="card" key={f.heading}>
                  <span className="card-icon" aria-hidden="true">
                    {FEATURE_ICONS[i]}
                  </span>
                  <h3>{f.heading}</h3>
                  <p>{f.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="block alt" id="how">
          <div className="wrap">
            <div className="heading">
              <span className="eyebrow dark">How it works</span>
              <h2>From listing to settlement</h2>
            </div>
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li className="step" key={s.heading}>
                  <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.heading}</h3>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="block" id="banks">
          <div className="wrap">
            <div className="panel">
              <div>
                <span className="eyebrow">For banks</span>
                <h2>Running gold auctions? Bring them to {BANKERS_GOLD.name}.</h2>
                <p>
                  A modern, mobile-first way to list gold-loan auctions and
                  reach bidders beyond a newspaper notice. Your bank keeps full
                  control of reserve prices, eligibility, EMD accounting and
                  settlement.
                </p>
              </div>
              <a className="btn" href={BANK_ONBOARDING.ctaHref}>
                {BANK_ONBOARDING.ctaLabel}
              </a>
            </div>
          </div>
        </section>

        <section className="block download">
          <div className="wrap">
            <h2>Get {BANKERS_GOLD.name}</h2>
            <StoreBadges />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap">
          <nav aria-label={`${BANKERS_GOLD.name} policies`}>
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <p>
            {BANKERS_GOLD.name} is built and published by{" "}
            <Link href="/">{company.legalName}</Link>.{" "}
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </p>
          <p className="fine">
            {BANKERS_GOLD.name} is a technology platform. Auctions are run by
            the listing bank under its own rules; we do not hold gold or
            deposits.
          </p>
        </div>
      </footer>
    </>
  );
}
