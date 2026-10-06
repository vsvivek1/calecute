import Link from "next/link";
import {
  CONTACT,
  LEGAL_LINKS,
  NAV,
  QUIZKERALA,
  company,
} from "@/lib/quizkerala/content";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-cols">
          <div className="footer-about">
            <Link href="/quizkerala" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/quizkerala/logo.svg" alt="" width={36} height={36} />
              <span>
                Quiz<span className="accent">Kerala</span>
              </span>
            </Link>
            <p>{QUIZKERALA.tagline}</p>
          </div>

          <div>
            <h3>Explore</h3>
            <ul>
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Legal</h3>
            <ul>
              {LEGAL_LINKS.map((n) => (
                <li key={n.href}>
                  <Link href={n.href}>{n.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Contact</h3>
            <ul>
              <li>
                <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              </li>
              <li>
                <a href={`https://${company.domain}`}>{company.domain}</a>
              </li>
              <li>
                <span style={{ color: "var(--ink-muted)", fontSize: "0.92rem" }}>
                  {CONTACT.address}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-base">
          <p>
            {QUIZKERALA.name} is built and published by {company.legalName},{" "}
            {company.jurisdiction}.
          </p>
          <p>
            &copy; {new Date().getFullYear()} {company.legalName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
