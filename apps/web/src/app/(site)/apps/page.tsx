import type { Metadata } from "next";
import Image from "next/image";
import { APPS } from "@/lib/apps";
import { STATIC_APPS } from "@/lib/static-apps";

export const metadata: Metadata = {
  title: "Mobile apps | Calecutech",
  description:
    "Privacy, support, and account deletion pages for the mobile apps published by Calecute Technologies LLC.",
};


const MONOGRAM_COLORS = ["bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-rose-600", "bg-amber-600", "bg-teal-600"];

type Tile = { key: string; name: string; tagline: string; href: string; image?: string; demo?: boolean };

/** One app as an image link: the whole tile is the link. Apps without an icon get a letter tile. */
function AppTile({ tile, index }: { tile: Tile; index: number }) {
  return (
    <a
      href={tile.href}
      className="group flex flex-col items-center rounded-2xl border border-black/10 p-4 text-center transition hover:-translate-y-0.5 hover:border-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-white/15 dark:hover:border-white/40"
    >
      {tile.image ? (
        <Image
          src={tile.image}
          alt=""
          width={96}
          height={96}
          unoptimized
          className="h-24 w-24 rounded-2xl object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={`flex h-24 w-24 items-center justify-center rounded-2xl text-4xl font-semibold text-white ${MONOGRAM_COLORS[index % MONOGRAM_COLORS.length]}`}
        >
          {tile.name.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className="mt-3 text-sm font-medium leading-snug group-hover:underline">{tile.name}</span>
      {tile.demo && (
        <span className="mt-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs">Demo build</span>
      )}
      <span className="mt-1 line-clamp-2 text-xs text-black/60 dark:text-white/60">{tile.tagline}</span>
    </a>
  );
}

export default function AppsPage() {
  const tiles: Tile[] = [
    ...APPS.map((a) => ({ key: a.slug, name: a.name, tagline: a.tagline, href: `/apps/${a.slug}`, image: a.iconSrc, demo: a.isDemo })),
    ...STATIC_APPS.map((a) => ({ key: a.href, ...a })),
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Mobile apps</h1>
      <p className="mt-2 text-black/60 dark:text-white/60">
        Privacy, support, and account deletion for each app we publish.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {tiles.map((t, i) => (
          <AppTile key={t.key} tile={t} index={i} />
        ))}
      </div>

      <h2 className="mt-14 text-xl font-semibold">Privacy, support and account deletion</h2>
      <div className="mt-6 space-y-6">
        {APPS.map((app) => (
          <section
            key={app.slug}
            className="rounded-xl border border-black/10 p-5 dark:border-white/15"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-medium">{app.name}</h2>
              {app.isDemo && (
                <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs">
                  Demo build
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-black/60 dark:text-white/60">
              {app.tagline}
            </p>
            <p className="mt-2 font-mono text-xs text-black/40 dark:text-white/40">
              {app.androidPackage}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <a className="underline" href={`/apps/${app.slug}`}>
                Overview
              </a>
              <a className="underline" href={`/apps/${app.slug}/privacy`}>
                Privacy policy
              </a>
              <a className="underline" href={`/apps/${app.slug}/support`}>
                Support
              </a>
              {app.terms && (
                <a className="underline" href={`/apps/${app.slug}/terms`}>
                  Terms
                </a>
              )}
              <a className="underline" href={`/apps/${app.slug}/delete-account`}>
                Delete your account
              </a>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
