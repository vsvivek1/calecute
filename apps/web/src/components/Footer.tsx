import Link from "next/link";
import { company, copyrightHolders, entities } from "@/lib/company";

const legalLinks = [
  { href: "/apps", label: "Mobile Apps" },
  { href: "/history-clock/privacy", label: "History Clock Privacy" },
  { href: "/history-clock/terms", label: "History Clock Terms" },
  { href: "/history-clock/delete-account", label: "History Clock Account Deletion" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refund & Cancellation Policy" },
  { href: "/data-deletion", label: "Data Deletion" },
  { href: "/report-unauthorized-transaction", label: "Report Unauthorized Transaction" },
];

const companyLinks = [
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/history-clock", label: "History Clock" },
  { href: "/about", label: "About" },
  { href: "/careers", label: "Careers" },
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
              {entities.map((e) => (
                <span key={e.key} className="mb-3 block">
                  <span className="block text-black/80 dark:text-white/80">
                    {e.legalName}
                  </span>
                  {e.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {e.ids.map((id) => (
                    <span key={id} className="block text-xs">
                      {id}
                    </span>
                  ))}
                </span>
              ))}
              <a className="block hover:underline" href={`mailto:${company.email}`}>
                {company.email}
              </a>
              <a className="block hover:underline" href="tel:+918547985289">
                +91 85479 85289
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
          &copy; {new Date().getFullYear()} {copyrightHolders}. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
