import Link from "next/link";
import { GooglePlayBadge } from "@/components/site/GooglePlayBadge";
import { PLAY_PRODUCTS, PRODUCT_CATEGORIES, type PlayProduct } from "@/lib/play-store";

const MONOGRAM_COLORS = ["bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-rose-600", "bg-amber-600", "bg-teal-600"];

type Tone = "auto" | "light";

function ProductCard({ product, index, tone }: { product: PlayProduct; index: number; tone: Tone }) {
  const auto = tone === "auto";
  const title = (
    <span className="font-semibold leading-snug hover:underline hover:underline-offset-4">{product.name}</span>
  );
  return (
    <li className={`flex flex-col rounded-2xl border border-black/10 bg-white/60 p-5 ${auto ? "dark:border-white/15 dark:bg-white/[.03]" : ""}`}>
      <div className="flex items-center gap-3">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-semibold text-white ${MONOGRAM_COLORS[index % MONOGRAM_COLORS.length]}`}
          >
            {product.name.charAt(0)}
          </span>
        )}
        {product.native ? <a href={product.href}>{title}</a> : <Link href={product.href}>{title}</Link>}
      </div>
      <p className={`mt-3 flex-1 text-sm leading-6 text-black/70 ${auto ? "dark:text-white/70" : ""}`}>{product.description}</p>
      <div className="mt-4">
        <GooglePlayBadge androidPackage={product.androidPackage} appName={product.name} size="sm" tone={tone} />
      </div>
    </li>
  );
}

/**
 * Every app we publish, grouped by category, each with a short description and
 * its Google Play badge (or "Coming soon"). Used on /apps and after quizzes.
 */
export function OurProducts({
  heading = "Our products",
  intro = "Apps made in Kozhikode by Calecute Technologies for students, bankers, families and small businesses across Kerala and India.",
  headingLevel = "h2",
  tone = "auto",
  className = "",
}: {
  tone?: Tone;
  heading?: string;
  intro?: string;
  headingLevel?: "h1" | "h2";
  className?: string;
}) {
  const Heading = headingLevel;
  const auto = tone === "auto";
  return (
    <section className={className} aria-label={heading}>
      <Heading className="text-3xl font-bold tracking-tight">{heading}</Heading>
      <p className={`mt-2 max-w-2xl text-black/60 ${auto ? "dark:text-white/60" : ""}`}>{intro}</p>
      {PRODUCT_CATEGORIES.map((category) => {
        const items = PLAY_PRODUCTS.filter((p) => p.category === category);
        if (!items.length) return null;
        return (
          <div key={category} className="mt-10">
            <h3 className={`text-sm font-semibold uppercase tracking-[0.16em] text-black/50 ${auto ? "dark:text-white/50" : ""}`}>
              {category}
            </h3>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.href} product={p} index={PLAY_PRODUCTS.indexOf(p)} tone={tone} />
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
