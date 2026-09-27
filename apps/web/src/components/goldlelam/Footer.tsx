import Link from "next/link";
import { company, GOLDLELAM, CONTACT } from "@/lib/goldlelam/content";

const legalLinks = [
  { href: "/goldlelam/privacy", label: "Privacy Policy" },
  { href: "/goldlelam/terms", label: "Terms of Use" },
  { href: "/goldlelam/refund", label: "Refund Policy" },
  { href: "/goldlelam/delete-account", label: "Delete Account" },
  { href: "/goldlelam/grievance", label: "Grievance Officer" },
  { href: "/goldlelam/support", label: "Support" },
];

/**
 * Per the brief: GoldLelam is pink-branded throughout, and Calecute — the
 * publisher — appears only here, as a quiet footer attribution. There is no
 * dedicated Calecute logo asset in this repo yet (the site's own header uses
 * text, see components/Header.tsx); `.calecute-mark` mirrors the dark
 * rounded-square shape of `src/app/icon.svg` as a stand-in until one exists.
 */
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-brand">
          <span className="calecute-mark" aria-hidden="true" />
          <span>
            {GOLDLELAM.name} is built and published by{" "}
            <strong>{company.shortName}</strong>
          </span>
        </div>

        <div className="footer-legal-lines">
          <p>{company.legalName}</p>
          <p>CIN {company.cin}</p>
          {company.gstin && <p>GSTIN {company.gstin}</p>}
          <p>{company.registeredOffice}</p>
          <p>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </p>
        </div>

        <nav className="footer-links" aria-label="GoldLelam legal">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="chips-note" style={{ marginTop: "1.5rem" }}>
          &copy; {new Date().getFullYear()} {company.legalName}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
