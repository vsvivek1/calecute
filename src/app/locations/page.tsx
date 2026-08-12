import { company, officeLines } from "@/lib/company";

export const metadata = {
  title: "Locations | Calecutech",
  description:
    "Calecutech operations office in Kozhikode, Kerala, India, and registered entity Calecute Technologies LLC.",
};

export default function LocationsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Locations</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Where to find us.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
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
            Our development and support team works from here.
          </p>
        </div>

        <div className="rounded-xl border border-black/10 p-6 dark:border-white/15">
          <h2 className="text-lg font-medium">Registered entity</h2>
          <p className="mt-2 text-sm text-black/70 dark:text-white/70">
            {company.legalName}
            <br />
            {company.jurisdiction}
          </p>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            The legal entity behind {company.brand} and {company.domain}.
          </p>
        </div>
      </div>

      <p className="mt-8 text-sm text-black/60 dark:text-white/60">
        Reach either location by email at{" "}
        <a
          className="underline underline-offset-2"
          href={`mailto:${company.email}`}
        >
          {company.email}
        </a>
        .
      </p>
    </div>
  );
}
