import Image from "next/image";
import Link from "next/link";
import { Accent, CtaPanel, PageHero } from "@/components/site/Bold";

/**
 * What we sell.
 *
 * The same catalogue is seeded into the API database by
 * apps/api/scripts/seed.mts, because an administrator assigns products to
 * commission agents from those rows. Keep the two in step — this page is the
 * public description, that one is the record agents work against.
 *
 * `href` is set only where a product actually has a page. A link to a route
 * that does not exist is worse than no link.
 */

type Product = {
  title: string;
  desc: string;
  emoji: string;
  color: string;
  href?: string;
  /** App logo shown instead of the emoji. */
  image?: string;
  /** Link with a plain <a>: the target is a static site under public/, not a Next route. */
  native?: boolean;
};

const featured: (Product & { badge: string; badgeClass: string })[] = [
  {
    title: "BankMates",
    desc:
      "An app for Indian bank staff — staff loan, SIP, FD/RD, EMI and SARFAESI calculators that run offline on the phone, JAIIB and CAIIB study material, and a doubts-and-tips space visible only to colleagues at the same bank.",
    emoji: "☕",
    color: "bg-amber-100 dark:bg-amber-900/30",
    href: "/apps/bankmates",
    badge: "New",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    title: "DailyDo",
    desc:
      "Smart task management for individuals and teams — create offices, manage projects, assign tasks, and stay organised in real time.",
    emoji: "✅",
    color: "bg-blue-100 dark:bg-blue-900/30",
    href: "/products/dailydo",
    badge: "Live",
    badgeClass:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  },
];

const learning: Product[] = [
  {
    title: "QuizKerala",
    desc: "Timed online quizzes for schools, clubs and colleges. Google sign-in, join with a code, one attempt each, and a live leaderboard where the faster player wins ties.",
    emoji: "⏱️",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    href: "/quizkerala",
    image: "/quizkerala/logo-192.png",
  },
  {
    title: "Recallio: USS Kerala Exam Prep",
    desc: "Short daily study cards for the Class 7 USS scholarship exam, in Malayalam and English. Built from the textbook and revised at the right time.",
    emoji: "🏆",
    color: "bg-amber-100 dark:bg-amber-900/30",
    href: "/uss-recallio",
    image: "/uss-recallio/assets/logo-96.png",
    native: true,
  },
  {
    title: "Recallio: Energy Manager",
    desc: "Daily study plan for the BEE Energy Manager and Energy Auditor exam. Enrol in the papers you need; the app sets each day's cards, solved problems and revision.",
    emoji: "⚡",
    color: "bg-lime-100 dark:bg-lime-900/30",
    href: "https://energy.recallio.calecutech.com",
    native: true,
  },
  {
    title: "Recallio: LSS Kerala Exam Prep",
    desc: "Short daily study cards for the Class 4 LSS scholarship exam, in Malayalam and English. Coming soon.",
    emoji: "🏅",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
    href: "/lss-recallio",
    image: "/lss-recallio/assets/logo.svg",
    native: true,
  },
  {
    title: "Recallio: Plus One Science",
    desc: "Short daily study cards for Kerala Higher Secondary Plus One Science, in Malayalam and English. Coming soon.",
    emoji: "🧪",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
    href: "/plus-one-science",
    image: "/plus-one-science/assets/logo.svg",
    native: true,
  },
  {
    title: "Recallio: Plus Two Science",
    desc: "Short daily study cards for Kerala Higher Secondary Plus Two Science, in Malayalam and English. Coming soon.",
    emoji: "⚛️",
    color: "bg-sky-100 dark:bg-sky-900/30",
    href: "/plus-two-science",
    image: "/plus-two-science/assets/logo.svg",
    native: true,
  },
  {
    title: "Win LSS",
    desc: "LSS scholarship preparation for Class 4 — previous papers, timed model exams, and progress by subject.",
    emoji: "🏅",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    title: "Win USS",
    desc: "USS scholarship preparation for Class 7 — previous papers, timed model exams, and progress by subject.",
    emoji: "🏆",
    color: "bg-orange-100 dark:bg-orange-900/30",
  },
  {
    title: "Win PSC",
    desc: "Kerala PSC preparation — syllabus-wise question banks, current affairs, and ranked mock tests.",
    emoji: "📚",
    color: "bg-teal-100 dark:bg-teal-900/30",
  },
  {
    title: "Win UPSC",
    desc: "UPSC civil services preparation — prelims mock tests, current affairs, and answer writing practice.",
    emoji: "🎯",
    color: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    title: "MockTest",
    desc: "Online testing for coaching institutes — question banks, scheduled exams, and rank lists.",
    emoji: "📝",
    color: "bg-violet-100 dark:bg-violet-900/30",
  },
  {
    title: "Vidyaz",
    desc: "School student management — admissions, attendance, marks, fees, and messages to parents.",
    emoji: "🎓",
    color: "bg-sky-100 dark:bg-sky-900/30",
  },
];

const business: Product[] = [
  {
    title: "Doplando",
    desc: "ERP for small companies — inventory, billing, purchases, and accounts in one place.",
    emoji: "📦",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    title: "Sparex",
    desc: "Vehicle services — service booking, job cards, and workshop records for owners and garages.",
    emoji: "🔧",
    color: "bg-slate-100 dark:bg-slate-800/50",
  },
  {
    title: "FPO",
    desc: "The farmers' digital mall: every farmer opens a shop, buyers order straight from the farm.",
    emoji: "🌾",
    color: "bg-lime-100 dark:bg-lime-900/30",
    href: "/farmconnect",
    native: true,
  },
];

const finance: Product[] = [
  {
    title: "rdManagement",
    desc: "For recurring deposit agents — subscriber records, collection schedules, and receipts.",
    emoji: "💰",
    color: "bg-green-100 dark:bg-green-900/30",
  },
  {
    title: "Chittu",
    desc: "Chitty management for local chit funds — subscribers, auctions, instalments, and payouts.",
    emoji: "🤝",
    color: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  {
    title: "Sarfez Field",
    desc: "Field officer asset capture for SARFAESI possession, with photographs and location recorded on site.",
    emoji: "📍",
    color: "bg-indigo-100 dark:bg-indigo-900/30",
    href: "/apps/sarfez-field",
  },
  {
    title: "Sarfez Auctions",
    desc: "Bank auction property listings for buyers — search by district, and register interest.",
    emoji: "🏠",
    color: "bg-purple-100 dark:bg-purple-900/30",
    href: "/apps/sarfez-auctions",
  },
];

const services: Product[] = [
  {
    title: "Mobile Apps for Sellers",
    desc: "Custom and ready-made mobile apps for sellers, including ladies' items sellers, agriculture sellers, and other vertical marketplaces.",
    emoji: "📱",
    color: "bg-pink-100 dark:bg-pink-900/30",
  },
  {
    title: "Website Development",
    desc: "Custom websites and e-commerce storefronts built and deployed for your business.",
    emoji: "🌐",
    color: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    title: "Payment Gateway Integration",
    desc: "Secure payment gateway setup and integration for your website or app.",
    emoji: "💳",
    color: "bg-green-100 dark:bg-green-900/30",
  },
];

function Icon({ emoji, color, image }: { emoji: string; color: string; image?: string }) {
  if (image) {
    return (
      <Image src={image} alt="" width={48} height={48} unoptimized className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-sm" />
    );
  }
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${color}`}
      aria-hidden="true"
    >
      {emoji}
    </div>
  );
}

/** A card, linked when the product has a page of its own and static when not. */
function Card({ product }: { product: Product }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-4">
        <Icon emoji={product.emoji} color={product.color} image={product.image} />
        {product.href && (
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-sm transition group-hover:-rotate-45 group-hover:border-transparent group-hover:bg-foreground group-hover:text-background dark:border-white/15"
          >
            →
          </span>
        )}
      </div>
      <h3 className="mt-6 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight">
        {product.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
        {product.desc}
      </p>
      {product.href && <span className="sr-only">Learn more</span>}
    </>
  );

  const shell =
    "home-reveal group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-black/[.08] bg-[linear-gradient(160deg,rgba(0,0,0,0.02),transparent_60%)] p-7 dark:border-white/10 dark:bg-[linear-gradient(160deg,rgba(255,255,255,0.04),transparent_60%)]";

  const linked = `${shell} transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_30px_60px_-30px_rgba(79,70,229,0.45)] dark:hover:border-indigo-500/50`;
  if (product.href && product.native) {
    return (
      <a href={product.href} className={linked}>
        {body}
      </a>
    );
  }
  return product.href ? (
    <Link href={product.href} className={linked}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

function sectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z]+/g, "-");
}

function Section({ title, items }: { title: string; items: Product[] }) {
  const id = sectionId(title);
  return (
    <section aria-labelledby={id} id={`${id}section`} className="scroll-mt-24 pt-20">
      <div className="home-reveal flex items-baseline justify-between gap-4 border-b border-black/[.08] pb-5 dark:border-white/10">
        <h2 id={id} className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
          {title}
        </h2>
        <span className="font-mono text-sm tabular-nums text-black/40 dark:text-white/40">
          {items.length} {items.length === 1 ? "product" : "products"}
        </span>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Card key={p.title} product={p} />
        ))}
      </div>
    </section>
  );
}

const sections = [
  { title: "Learning and schools", items: learning },
  { title: "Business", items: business },
  { title: "Banking and finance", items: finance },
  { title: "Services", items: services },
];

const featuredLook: Record<string, string> = {
  BankMates: "bg-[linear-gradient(150deg,#78350f,#1c0f05)] hover:ring-amber-400/60",
  DailyDo: "bg-[linear-gradient(150deg,#1e3a8a,#0b1530)] hover:ring-blue-400/60",
};

export default function ProductsPage() {
  return (
    <div className="font-sans">
      <PageHero
        eyebrow="Products"
        title={
          <>
            What we <Accent onDark>sell.</Accent>
          </>
        }
        lede="Apps for learners, schools, small businesses and banks."
      >
        <nav aria-label="Product categories" className="mt-12">
          <ul className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <li key={s.title}>
                <a
                  href={`#${sectionId(s.title)}section`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur transition hover:border-white/30 hover:bg-white/10"
                >
                  {s.title}
                  <span className="rounded-full bg-white/10 px-1.5 text-xs tabular-nums text-white/60">
                    {s.items.length}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageHero>

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((p) => (
            <Link
              key={p.title}
              href={p.href ?? "#"}
              className={`home-reveal group relative flex flex-col overflow-hidden rounded-[1.75rem] p-8 text-white ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 sm:p-10 ${featuredLook[p.title] ?? "bg-zinc-900"}`}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 text-[12rem] leading-none opacity-15 transition duration-700 group-hover:rotate-12 group-hover:scale-110"
              >
                {p.emoji}
              </div>
              <div className="relative flex items-start justify-between gap-4">
                <Icon emoji={p.emoji} color="bg-white/15" />
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.badgeClass}`}>
                  {p.badge}
                </span>
              </div>
              <h2 className="relative mt-8 font-[family-name:var(--font-display)] text-4xl font-bold tracking-[-0.03em]">
                {p.title}
              </h2>
              <p className="relative mt-3 max-w-md text-white/75">{p.desc}</p>
              <span className="relative mt-auto pt-8 text-sm font-semibold">
                Learn more{" "}
                <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>

        {sections.map((s) => (
          <Section key={s.title} title={s.title} items={s.items} />
        ))}
      </div>

      <CtaPanel
        title={
          <>
            Need something <Accent onDark>custom?</Accent>
          </>
        }
        lede="We build web apps, mobile apps and SaaS products for clients too."
        secondary={{ href: "/services", label: "View services" }}
      />
    </div>
  );
}
