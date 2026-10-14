import { company, officeLines } from "@/lib/company";
import { Accent, PageHero } from "@/components/site/Bold";

export const metadata = {
  title: "Contact | Calecutech",
  description:
    "Contact Calecute Technologies LLC — email, registered entity, and operations office in Kozhikode, Kerala, India.",
};

const card =
  "home-reveal rounded-[1.75rem] border border-black/[.08] p-8 transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(79,70,229,0.35)] dark:border-white/10";

export default function ContactPage() {
  return (
    <div className="font-sans">
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Tell us what you&rsquo;re <Accent onDark>building.</Accent>
          </>
        }
        lede={<>We&rsquo;ll reply within 2 business days.</>}
      >
        <a
          href={`mailto:${company.email}`}
          className="group mt-12 inline-flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 font-[family-name:var(--font-display)] text-[clamp(1.75rem,5vw,3.75rem)] font-bold tracking-[-0.03em]"
        >
          <span className="break-all bg-[linear-gradient(110deg,#ffffff,#c7d2fe)] bg-clip-text text-transparent underline decoration-white/20 decoration-2 underline-offset-[10px] transition group-hover:decoration-fuchsia-400">
            {company.email}
          </span>
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-black shadow-[0_0_40px_rgba(165,180,252,0.5)] transition-transform group-hover:translate-x-1 group-hover:-rotate-45"
          >
            →
          </span>
        </a>
      </PageHero>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-24 md:grid-cols-3">
        <div className={`${card} bg-[linear-gradient(160deg,rgba(99,102,241,0.12),transparent_60%)]`}>
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg text-white shadow-lg shadow-indigo-600/30">
            @
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">Email</h2>
          <p className="mt-2 text-[15px]">
            <a className="font-medium underline underline-offset-4" href={`mailto:${company.email}`}>
              {company.email}
            </a>
          </p>
          <p className="mt-3 text-sm text-black/60 dark:text-white/60">
            For new projects, billing questions, and support.
          </p>
        </div>

        <div className={`${card} bg-[linear-gradient(160deg,rgba(217,70,239,0.1),transparent_60%)]`}>
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-600 text-lg text-white shadow-lg shadow-fuchsia-600/30">
            ⌖
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            Operations office
          </h2>
          <address className="mt-2 text-[15px] not-italic">
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

        <div className={`${card} bg-[linear-gradient(160deg,rgba(245,158,11,0.12),transparent_60%)]`}>
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-lg text-white shadow-lg shadow-amber-500/30">
            §
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
            Registered entity
          </h2>
          <p className="mt-2 text-[15px]">
            {company.legalName}, {company.jurisdiction}. Trading as{" "}
            {company.brand} at {company.domain}.
          </p>
        </div>
      </section>
    </div>
  );
}
