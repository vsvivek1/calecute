import Image from "next/image";
import Link from "next/link";

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
    desc: "For farmer producer organisations — member records, procurement, and produce trade.",
    emoji: "🌾",
    color: "bg-lime-100 dark:bg-lime-900/30",
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
      <Image src={image} alt="" width={48} height={48} unoptimized className="h-12 w-12 shrink-0 rounded-lg object-cover" />
    );
  }
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl ${color}`}
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
      <Icon emoji={product.emoji} color={product.color} image={product.image} />
      <h3 className="mt-4 text-lg font-medium">{product.title}</h3>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        {product.desc}
      </p>
      {product.href && (
        <span className="mt-4 inline-block text-sm font-medium underline underline-offset-2">
          Learn more →
        </span>
      )}
    </>
  );

  const shell =
    "rounded-xl border border-black/10 p-6 dark:border-white/15";

  const linked = `${shell} transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.06]`;
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

function Section({ title, items }: { title: string; items: Product[] }) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mt-14 text-xl font-semibold">
        {title}
      </h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Card key={p.title} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Products</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">What we sell.</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {featured.map((p) => (
          <Link
            key={p.title}
            href={p.href ?? "#"}
            className="rounded-xl border border-black/10 p-6 transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            <div className="flex items-start justify-between gap-4">
              <Icon emoji={p.emoji} color={p.color} />
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.badgeClass}`}
              >
                {p.badge}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-medium">{p.title}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {p.desc}
            </p>
            <span className="mt-4 inline-block text-sm font-medium underline underline-offset-2">
              Learn more →
            </span>
          </Link>
        ))}
      </div>

      <Section title="Learning and schools" items={learning} />
      <Section title="Business" items={business} />
      <Section title="Banking and finance" items={finance} />
      <Section title="Services" items={services} />
    </div>
  );
}
