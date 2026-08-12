import { company, officeLines } from "@/lib/company";

export const metadata = {
  title: "Contact | Calecutech",
  description:
    "Contact Calecute Technologies LLC — email, registered entity, and operations office in Kozhikode, Kerala, India.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Tell us what you&rsquo;re building and we&rsquo;ll reply within 2
        business days.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-6 dark:border-white/15">
          <h2 className="text-lg font-medium">Email</h2>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            <a
              className="underline underline-offset-2"
              href={`mailto:${company.email}`}
            >
              {company.email}
            </a>
          </p>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            For new projects, billing questions, and support.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 p-6 dark:border-white/15">
          <h2 className="text-lg font-medium">Operations office</h2>
          <address className="mt-2 text-sm not-italic text-black/70 dark:text-white/70">
            {officeLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            Our development team works from here.
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-black/10 p-6 dark:border-white/15">
        <h2 className="text-lg font-medium">Registered entity</h2>
        <p className="mt-2 text-sm text-black/70 dark:text-white/70">
          {company.legalName}, {company.jurisdiction}. Trading as{" "}
          {company.brand} at {company.domain}.
        </p>
      </div>
    </div>
  );
}
