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
    title: "Colorful Logo Design",
    desc: "Custom, vibrant logos designed to match your brand identity.",
    emoji: "🎨",
    color: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    title: "Animations",
    desc: "Motion graphics and UI animations for apps, websites, and marketing.",
    emoji: "✨",
    color: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  {
    title: "Icon Design",
    desc: "Custom icon sets for apps and websites, designed to fit your brand.",
    emoji: "🔷",
    color: "bg-orange-100 dark:bg-orange-900/30",
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
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
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
