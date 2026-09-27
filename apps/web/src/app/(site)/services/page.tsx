import Link from "next/link";
import { pricingModels, services } from "@/lib/offerings";

export const metadata = {
  title: "Services | Calecutech",
  description:
    "Custom web development, mobile app development, SaaS product development, and backend & API systems for businesses worldwide.",
};

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Services</h1>
      <p className="mt-2 max-w-2xl text-black/60 dark:text-white/60">
        We build web applications, mobile apps, and scalable SaaS platforms for
        international clients — from a single site to a full product team.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {services.map((s) => (
          <div
            key={s.title}
            className="rounded-xl border border-black/10 p-6 dark:border-white/15"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl ${s.color}`}
            >
              {s.emoji}
            </div>
            <h2 className="mt-4 text-lg font-medium">{s.title}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {s.desc}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-black/70 dark:text-white/70">
              {s.details.map((d) => (
                <li key={d} className="flex gap-2">
                  <span aria-hidden="true" className="text-black/30 dark:text-white/30">
                    &bull;
                  </span>
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold">Our Pricing Model</h2>
        <p className="mt-2 max-w-2xl text-black/60 dark:text-white/60">
          Every engagement is invoiced against one of these three models, agreed
          in writing before work begins.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {pricingModels.map((p) => (
            <div
              key={p.title}
              className="rounded-xl border border-black/10 p-6 dark:border-white/15"
            >
              <h3 className="text-lg font-medium">{p.title}</h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                {p.desc}
              </p>
              <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                {p.detail}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-black/60 dark:text-white/60">
          See our{" "}
          <Link href="/refund-policy" className="underline underline-offset-2">
            Refund &amp; Cancellation Policy
          </Link>{" "}
          for how cancellations and refunds are handled, and our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>{" "}
          for the full engagement terms.
        </p>
      </section>

      <section className="mt-16 rounded-xl border border-black/10 p-6 dark:border-white/15 sm:p-8">
        <h2 className="text-xl font-medium">Start a project</h2>
        <p className="mt-2 text-black/70 dark:text-white/70">
          Tell us what you&rsquo;re building and we&rsquo;ll come back with a
          scope, a timeline, and a written quote.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
        >
          Get in touch
        </Link>
      </section>
    </div>
  );
}
