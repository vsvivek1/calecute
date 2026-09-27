import Link from "next/link";
import { company, officeLines } from "@/lib/company";

const legalLinks = [
  { href: "/apps", label: "Mobile Apps" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund & Cancellation Policy" },
  { href: "/data-deletion", label: "Data Deletion" },
];

const companyLinks = [
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="mx-auto max-w-5xl px-6 py-10 text-sm">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="font-medium">{company.brand}</p>
            <address className="mt-2 not-italic text-black/60 dark:text-white/60">
              {company.legalName}
              <span className="block">{company.jurisdiction}</span>
              <span className="mt-2 block">{officeLines.join(", ")}</span>
              <a
                className="mt-2 block hover:underline"
                href={`mailto:${company.email}`}
              >
                {company.email}
              </a>
            </address>
          </div>

          <div>
            <p className="font-medium">Company</p>
            <ul className="mt-2 space-y-1.5 text-black/60 dark:text-white/60">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-medium">Legal</p>
            <ul className="mt-2 space-y-1.5 text-black/60 dark:text-white/60">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-black/10 pt-6 text-black/60 dark:border-white/10 dark:text-white/60">
          &copy; {new Date().getFullYear()} {company.legalName}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
