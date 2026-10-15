import Link from "next/link";

/**
 * Shared pieces for the marketing pages, matching the home page: a dark inset
 * hero panel with a drifting glow, big display headings with one serif-italic
 * accent word, and a closing call-to-action panel.
 */

const gradientText =
  "bg-[linear-gradient(110deg,#a5b4fc,#e879f9,#f9a8d4,#fcd34d,#a5b4fc)] bg-clip-text text-transparent";

/** The accent word in a heading. `onDark` switches to the animated gradient. */
export function Accent({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <span
      className={`font-[family-name:var(--font-serif)] font-normal italic tracking-[-0.02em] ${
        onDark ? `home-shine ${gradientText}` : "text-indigo-600 dark:text-indigo-400"
      }`}
    >
      {children}
    </span>
  );
}

function Aurora({ tone = "default" }: { tone?: "default" | "warm" }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="home-blob absolute -left-[10%] -top-[40%] h-[90%] w-[55%] rounded-full bg-[#4f46e5] opacity-50 blur-[120px]" />
      <div
        className={`home-blob absolute -right-[10%] top-[-30%] h-[80%] w-[50%] rounded-full opacity-40 blur-[120px] [animation-delay:-6s] ${
          tone === "warm" ? "bg-[#f59e0b]" : "bg-[#c026d3]"
        }`}
      />
      <div className="home-blob absolute bottom-[-30%] left-[30%] h-[70%] w-[45%] rounded-full bg-[#a83a5e] opacity-40 blur-[120px] [animation-delay:-12s]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_20%,#000_30%,transparent_100%)]" />
    </div>
  );
}

/** Dark inset hero for an inner page. */
export function PageHero({
  eyebrow,
  title,
  lede,
  tone,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  tone?: "default" | "warm";
  children?: React.ReactNode;
}) {
  return (
    <section className="px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#07070c] text-white">
        <Aurora tone={tone} />
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/75 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[linear-gradient(110deg,#a5b4fc,#e879f9)]" />
            {eyebrow}
          </p>
          <h1 className="mt-6 max-w-4xl text-balance font-[family-name:var(--font-display)] text-[clamp(2.75rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.045em]">
            {title}
          </h1>
          {lede && (
            <p className="mt-6 max-w-2xl text-pretty text-lg text-white/65 sm:text-xl">{lede}</p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}

/** Eyebrow plus big heading for a section on a light background. */
export function SectionHeading({
  eyebrow,
  title,
  lede,
  id,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="home-reveal">
      <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{eyebrow}</p>
      <h2
        id={id}
        className="mt-3 max-w-3xl text-balance font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.035em] sm:text-5xl"
      >
        {title}
      </h2>
      {lede && (
        <p className="mt-4 max-w-2xl text-lg text-black/60 dark:text-white/60">{lede}</p>
      )}
    </div>
  );
}

export const primaryButton =
  "group inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 text-sm font-semibold text-black shadow-[0_0_40px_rgba(165,180,252,0.45)] transition hover:shadow-[0_0_60px_rgba(232,121,249,0.6)]";

export const ghostButton =
  "inline-flex h-13 items-center rounded-full border border-white/20 bg-white/5 px-7 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10";

/** Closing dark panel with a big heading and up to two actions. */
export function CtaPanel({
  title,
  lede,
  primary = { href: "/contact", label: "Start a project" },
  secondary,
}: {
  title: React.ReactNode;
  lede?: React.ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string; external?: boolean };
}) {
  return (
    <section className="px-3 pb-4 sm:px-4">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#07070c] px-6 py-20 text-center text-white sm:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="home-blob absolute left-[10%] top-[20%] h-[60%] w-[40%] rounded-full bg-[#4f46e5] opacity-45 blur-[120px]" />
          <div className="home-blob absolute right-[10%] top-[30%] h-[60%] w-[40%] rounded-full bg-[#db2777] opacity-35 blur-[120px] [animation-delay:-8s]" />
        </div>
        <h2 className="home-reveal mx-auto max-w-4xl text-balance font-[family-name:var(--font-display)] text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.045em]">
          {title}
        </h2>
        {lede && <p className="mx-auto mt-6 max-w-lg text-lg text-white/60">{lede}</p>}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href={primary.href} className={primaryButton}>
            {primary.label}
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          {secondary &&
            (secondary.external ? (
              <a href={secondary.href} className={ghostButton}>
                {secondary.label}
              </a>
            ) : (
              <Link href={secondary.href} className={ghostButton}>
                {secondary.label}
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
