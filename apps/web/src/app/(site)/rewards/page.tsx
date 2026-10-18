/**
 * /rewards — the public leaderboard and the two ways to earn.
 *
 * Every app user has an invite code; sellers have a seller code. This page
 * is where both see how they rank, so it is deliberately plain about the
 * terms: 1% of fees on paid apps or a diamond per friend on free ones for
 * everyone, and 10% to 30% per product for sellers. Names are masked by the
 * API before they get here.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Accent, PageHero, SectionHeading } from "@/components/site/Bold";
import {
  getLeaderboard,
  getPublicProducts,
  type Leaderboard,
  type PublicProduct,
} from "@/lib/api/client";
import { formatRupees } from "@/components/agents/Money";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Invite friends & get rewards | Calecutech",
  description:
    "Share your invite code from any Calecute app. Earn 1% of what friends pay on paid apps, a diamond for every friend who joins a free app, and see who is ahead on the leaderboard.",
  alternates: { canonical: "/rewards" },
};

const SLUG = /^[a-z0-9-]{1,80}$/;

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requested = typeof params.app === "string" ? params.app.trim().toLowerCase() : "";
  const app = SLUG.test(requested) ? requested : null;

  // The page must render even when the API is unreachable (including at
  // build time, where no API_BASE_URL may be set): an empty board, not a 500.
  let products: PublicProduct[] = [];
  let board: Leaderboard | null = null;
  try {
    [products, board] = await Promise.all([
      getPublicProducts().then((r) => r.data),
      getLeaderboard({ app: app ?? undefined, limit: 50 }),
    ]);
  } catch {
    board = null;
  }

  const selected = products.find((p) => p.slug === app) ?? null;
  const rows = board?.rows ?? [];

  return (
    <div className="font-sans">
      <PageHero
        eyebrow="Referral rewards"
        title={
          <>
            Invite friends &amp; get <Accent onDark>rewards.</Accent>
          </>
        }
        lede={
          <>
            <span lang="ml" className="block">
              സുഹൃത്തുക്കളെ ക്ഷണിക്കൂ, റിവാർഡുകൾ നേടൂ
            </span>
            <span className="mt-2 block">
              Every Calecute app gives you an invite code the moment you sign in.
              Share it; what your friends do earns you rewards, across every app.
            </span>
          </>
        }
      />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          eyebrow="Two ways to earn"
          title="Everyone earns. Sellers earn more."
          lede="One code, one leaderboard, every app. The terms are the same for everybody in a tier."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Every user</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Your invite code</h3>
            <ul className="mt-4 space-y-2 text-black/70 dark:text-white/70">
              <li>
                <strong className="font-medium text-black dark:text-white">Paid apps:</strong> 1% of
                every payment a friend makes, for as long as they keep paying. Paid monthly, after GST
                and gateway charges, with 2% TDS deducted.
              </li>
              <li>
                <strong className="font-medium text-black dark:text-white">Free apps:</strong> one
                diamond for every friend who joins. Diamonds are recognition on this board, not money.
              </li>
              <li>No application, no documents. Open any Calecute app and share your code.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-black/10 p-6 dark:border-white/15">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Sellers</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight">Commission agents</h3>
            <ul className="mt-4 space-y-2 text-black/70 dark:text-white/70">
              <li>
                <strong className="font-medium text-black dark:text-white">10% to 30%</strong> of
                every payment a referred customer makes, set per product.
              </li>
              <li>Vetted and placed by panchayat, with PAN and bank details for payouts.</li>
              <li>
                <Link href="/agents" className="underline">
                  About the commission agent programme
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <SectionHeading
          eyebrow="Leaderboard"
          title={selected ? <>Top referrers on {selected.nameEn}</> : <>Top referrers across all apps</>}
          lede="Updated every minute. Names are shortened to first name and last initial."
        />

        <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-black/60 dark:text-white/60">App</span>
            <select
              name="app"
              defaultValue={app ?? ""}
              className="mt-1 h-10 rounded-lg border border-black/15 bg-transparent px-3 dark:border-white/20"
            >
              <option value="">All apps</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.nameEn}
                  {p.isFree ? " (free)" : ""}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-10 rounded-lg border border-black/15 px-4 text-sm font-medium dark:border-white/20"
          >
            Show
          </button>
        </form>

        {board === null ? (
          <p className="mt-8 text-black/60 dark:text-white/60">
            The leaderboard is not available right now. Try again in a minute.
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-black/60 dark:text-white/60">
            Nobody on the board yet{selected ? ` for ${selected.nameEn}` : ""}. Share your code and be
            the first.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-black/10 dark:border-white/15">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/[0.03] text-xs uppercase tracking-wide text-black/60 dark:bg-white/5 dark:text-white/60">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3 text-right">Diamonds</th>
                  <th className="px-4 py-3 text-right">Friends joined</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.rank} className="border-t border-black/5 dark:border-white/10">
                    <td className="px-4 py-3 tabular-nums">{row.rank}</td>
                    <td className="px-4 py-3 font-medium">{row.displayName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-black/10 px-2 py-0.5 text-xs dark:border-white/20">
                        {row.tier === "SELLER" ? "Seller" : "Member"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.diamonds > 0 ? `${row.diamonds} ◆` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{row.friendsJoined}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.earnedNetPaise > 0 ? formatRupees(row.earnedNetPaise) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-sm text-black/50 dark:text-white/50">
          Earned is net commission after TDS, not yet necessarily paid out. Diamonds never convert to
          money. One attribution per customer: the first code they use is the one that counts.
        </p>
      </section>
    </div>
  );
}
