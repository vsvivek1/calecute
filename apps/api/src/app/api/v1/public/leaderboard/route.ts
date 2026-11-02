/**
 * GET /api/v1/public/leaderboard?app=<slug>&limit=<1..100>
 *
 * Who has earned the most from referrals, both tiers, with names masked to
 * first name and last initial. Comes from app.public_leaderboard(), a
 * SECURITY DEFINER function that returns nothing identifying; see
 * drizzle/0009_referral_tiers.sql. Cached for a minute at the edge.
 */
import { z } from "zod";
import { sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { ok, publicRoute } from "@/lib/route";
import { parseQuery } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  app: z.string().trim().toLowerCase().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export interface LeaderboardRow {
  rank: number;
  displayName: string;
  tier: "USER" | "SELLER";
  diamonds: number;
  friendsJoined: number;
  payingFriends: number;
  earnedNetPaise: number;
}

export const GET = handler(
  publicRoute({ name: "public.leaderboard", limit: RULES.referralRead }, async (ctx) => {
    const query = parseQuery(ctx.url, querySchema);

    const rows = (await ctx.tx.execute(sql`
      SELECT rank, display_name, tier, diamonds, friends_joined, paying_friends, earned_net_paise
        FROM app.public_leaderboard(${query.app ?? null}, ${query.limit})
    `)) as unknown as {
      rank: number;
      display_name: string;
      tier: "USER" | "SELLER";
      diamonds: number;
      friends_joined: number;
      paying_friends: number;
      earned_net_paise: number | string;
    }[];

    const data: LeaderboardRow[] = rows.map((row) => ({
      rank: Number(row.rank),
      displayName: row.display_name,
      tier: row.tier,
      diamonds: Number(row.diamonds),
      friendsJoined: Number(row.friends_joined),
      payingFriends: Number(row.paying_friends),
      earnedNetPaise: Number(row.earned_net_paise),
    }));

    return ok(
      ctx,
      { app: query.app ?? null, limit: query.limit, currency: "INR", rows: data },
      200,
      60,
    );
  }),
);

export const OPTIONS = preflight;
