import { company } from "@/lib/company";
import { malayalam } from "@/lib/fonts";
import { Accent, PageHero, SectionHeading, primaryButton } from "@/components/site/Bold";

export const metadata = {
  title: "Careers | Calecutech",
  description:
    "Open roles at Calecute Technologies. We're hiring a work-from-home Coordinator in Kerala.",
};

const applySubject = "Application: Coordinator";
const applyHref = `mailto:${company.email}?subject=${encodeURIComponent(applySubject)}`;

/** The Coordinator listing, in Malayalam as written for the audience. */
const requirements = [
  "വിദ്യാഭ്യാസപരമായി ഉന്നത നിലവാരം പുലർത്തിയിരിക്കണം.",
  "വിജയിക്കാനുള്ള ആഗ്രഹം വെച്ചുപുലർത്തുന്നവർ ആയിരിക്കണം.",
  "SSLC-ക്ക് 500/ full A minimum മാർക്ക് എങ്കിലും ഉണ്ടാവണം.",
  "എൻജിനീയറിങ് ഡിഗ്രി ഉണ്ടാവണം.",
  "സപ്ലി ഉണ്ടാവാൻ പാടില്ല.",
  "അത്യാവശ്യം ആളുകളോട് ഫോണിലൂടെ സംസാരിക്കാനുള്ള പ്രാപ്തി ഉണ്ടാകണം.",
  "കമ്പ്യൂട്ടർ പരിജ്ഞാനം ഉണ്ടാവണം അല്ലെങ്കിൽ പഠിച്ചെടുക്കാനുള്ള താല്പര്യമുണ്ടാവണം.",
  "ക്ലാസുകൾ പ്രസന്റേഷൻ എന്നിവ എടുക്കേണ്ടി വന്നാൽ എടുക്കാനുള്ള പ്രാപ്തി ഉണ്ടാവണം.",
  "കമ്പനി ഉടമ എന്ന രീതിയിൽ കാര്യങ്ങൾ കൈകാര്യം ചെയ്യണം.",
];

const pay = [
  "സ്റ്റാർട്ടപ്പ് ആയതുകൊണ്ടാണ് ശമ്പളം കുറവുള്ളത്. സെയിൽസിന് അനുസരിച്ച് കമ്മീഷൻ ലഭിക്കുന്നതാണ്.",
  "കാര്യങ്ങൾ നന്നായി പോയാൽ, കമ്പനിയിൽ നിങ്ങൾക്ക് ഷെയറുകളും ലഭിക്കുന്നതാണ്.",
  "വരുമാനം ഉണ്ടാകുന്നതിനനുസരിച്ച്, നിങ്ങൾക്കും വരുമാനം വർദ്ധിക്കുന്നതാണ്.",
];

const facts = [
  { label: "Role", value: "Coordinator" },
  { label: "Location", value: "Work from home · വർക്ക് ഫ്രം ഹോം" },
  { label: "Pay", value: "Base + sales commission, equity possible" },
];

export default function CareersPage() {
  return (
    <div className={`font-sans ${malayalam.variable}`}>
      <PageHero
        eyebrow="Careers"
        tone="warm"
        title={
          <>
            Build the company <Accent onDark>with us.</Accent>
          </>
        }
        lede="We're an early-stage startup in Kerala. If you want to grow with the company, and own the results like an owner would, we'd like to hear from you."
      >
        <a href="#coordinator" className={`${primaryButton} mt-10`}>
          See open roles
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">↓</span>
        </a>
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          id="coordinator"
          eyebrow="Open role · 1"
          title={
            <>
              Coordinator <Accent>(work from home)</Accent>
            </>
          }
          lede="An engineering graduate with strong marks who can talk to people on the phone, take classes or presentations when needed, and run things like an owner. Low base pay for now, with commission on sales and a share in the company as it grows."
        />

        <dl className="home-reveal mt-10 grid gap-4 sm:grid-cols-3">
          {facts.map((f) => (
            <div
              key={f.label}
              className="rounded-[1.5rem] border border-black/[.08] bg-[linear-gradient(160deg,rgba(245,158,11,0.1),transparent_60%)] p-6 dark:border-white/10"
            >
              <dt className="font-mono text-xs uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                {f.label}
              </dt>
              <dd className="mt-2 font-[family-name:var(--font-geist-sans),var(--font-malayalam),sans-serif] text-lg font-semibold">
                {f.value}
              </dd>
            </div>
          ))}
        </dl>

        <div lang="ml" className="mt-4 grid gap-4 font-[family-name:var(--font-geist-sans),var(--font-malayalam),sans-serif] md:grid-cols-[1.4fr_1fr]">
          <div className="home-reveal rounded-[1.75rem] border border-black/[.08] bg-[linear-gradient(160deg,rgba(99,102,241,0.12),transparent_60%)] p-8 sm:p-10 dark:border-white/10">
            <h3 className="text-2xl font-bold tracking-tight">യോഗ്യതകൾ</h3>
            <ul className="mt-6 grid gap-4">
              {requirements.map((r) => (
                <li key={r} className="flex gap-3 text-[17px] leading-relaxed text-black/75 dark:text-white/75">
                  <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="home-reveal flex flex-col rounded-[1.75rem] bg-[#07070c] p-8 text-white ring-1 ring-white/10 sm:p-10">
            <h3 className="text-2xl font-bold tracking-tight">ശമ്പളവും വളർച്ചയും</h3>
            <ul className="mt-6 grid gap-4">
              {pay.map((p) => (
                <li key={p} className="flex gap-3 text-[17px] leading-relaxed text-white/75">
                  <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-10">
              <a href={applyHref} className={primaryButton}>
                Apply by email
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <p className="mt-4 font-sans text-sm text-white/55">
                Send your CV and SSLC and degree mark lists to{" "}
                <a className="underline underline-offset-4" href={applyHref}>
                  {company.email}
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
