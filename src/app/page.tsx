import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <section className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Calecutech
        </h1>
        <p className="mt-4 text-lg text-black/60 dark:text-white/60">
          Products, services, and support across our locations.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/products"
            className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
          >
            View Products
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-black/10 px-5 py-3 text-sm font-medium hover:bg-black/[.04] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            Contact Us
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-8 sm:grid-cols-3">
        {[
          { title: "Services", href: "/services", desc: "What we offer." },
          { title: "Products", href: "/products", desc: "What we sell." },
          { title: "Locations", href: "/locations", desc: "Where to find us." },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-black/10 p-6 transition-colors hover:bg-black/[.03] dark:border-white/15 dark:hover:bg-white/[.06]"
          >
            <h2 className="text-xl font-medium">{item.title}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {item.desc}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
