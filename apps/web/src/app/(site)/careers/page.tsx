import type { Metadata } from "next";
import { malayalam } from "@/lib/fonts";
import { CAREERS_URL, SITE_ORIGIN } from "@/lib/careers";
import { Accent, PageHero, SectionHeading, primaryButton } from "@/components/site/Bold";
import ApplyForm from "@/components/careers/ApplyForm";
import ShareButton from "@/components/careers/ShareButton";

const title = "We're hiring a Coordinator (work from home) | Calecutech";
const description =
  "Calecute Technologies is hiring a work-from-home Coordinator in Kerala: engineering graduates with strong marks. Base pay plus sales commission, with shares as the company grows. Apply online.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: "Careers | Calecutech",
  description,
  alternates: { canonical: CAREERS_URL },
  openGraph: { title, description, url: CAREERS_URL, siteName: "Calecutech", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

const shareText =
  "Calecutech is hiring a Coordinator (work from home). കോർഡിനേറ്റർ ഒഴിവ്, വർക്ക് ഫ്രം ഹോം. Apply here:";

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
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <a href="#coordinator" className={primaryButton}>
            See open roles
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">↓</span>
          </a>
          <ShareButton url={CAREERS_URL} title={title} text={shareText} onDark />
        </div>
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
              <a href="#apply" className={primaryButton}>
                Apply now
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">↓</span>
              </a>
            </div>
          </div>
        </div>

        <div className="home-reveal mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-black/[.08] px-6 py-5 dark:border-white/10">
          <p className="font-[family-name:var(--font-geist-sans),var(--font-malayalam),sans-serif] text-[15px] text-black/70 dark:text-white/70">
            Know someone who fits? <span lang="ml">ഈ ജോലി ഷെയർ ചെയ്യൂ.</span>
          </p>
          <ShareButton url={CAREERS_URL} title={title} text={shareText} />
        </div>
      </section>

      <section id="apply" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-24">
        <SectionHeading
          eyebrow="Apply"
          title={
            <>
              Apply for <Accent>Coordinator.</Accent>
            </>
          }
          lede="Fill this in and attach your CV. We read every application and will call you if you're shortlisted."
        />
        <div className="mt-10 font-[family-name:var(--font-geist-sans),var(--font-malayalam),sans-serif]">
          <ApplyForm role="Coordinator" />
        </div>
      </section>
    </div>
  );
}
