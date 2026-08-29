import Link from "next/link";

const featuredProducts = [
  {
    title: "DailyDo",
    desc: "Smart task management for individuals and teams — create offices, manage projects, assign tasks, and stay organised in real time.",
    emoji: "✅",
    color: "bg-blue-100 dark:bg-blue-900/30",
    href: "/products/dailydo",
    badge: "Live",
  },
];

const products = [
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
  {
    title: "Banking Solutions App",
    desc: "Secure banking and fintech apps with accounts, transfers, statements, and compliance-ready workflows.",
    emoji: "🏦",
    color: "bg-indigo-100 dark:bg-indigo-900/30",
  },
  {
    title: "Sparex App",
    desc: "Spare parts sourcing and inventory app connecting dealers, workshops, and suppliers.",
    emoji: "🔧",
    color: "bg-slate-100 dark:bg-slate-800/50",
  },
  {
    title: "Education Software",
    desc: "Learning platforms, e-learning apps, and software for schools and training centers.",
    emoji: "🎓",
    color: "bg-teal-100 dark:bg-teal-900/30",
  },
];

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Products</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        What we sell.
      </p>

      {/* Featured products */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {featuredProducts.map((p) => (
          <Link
            key={p.title}
            href={p.href}
            className="rounded-xl border border-black/10 p-6 transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-2xl ${p.color}`}
              >
                {p.emoji}
              </div>
              {p.badge && (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                  {p.badge}
                </span>
              )}
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

      {/* All products */}
      <h2 className="mt-14 text-xl font-semibold">Services &amp; Solutions</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {products.map((p) => (
          <div
            key={p.title}
            className="rounded-xl border border-black/10 p-6 dark:border-white/15"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${p.color}`}
            >
              {p.emoji}
            </div>
            <h2 className="mt-4 text-lg font-medium">{p.title}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {p.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
