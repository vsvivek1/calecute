/**
 * POST /api/v1/payouts/mobile/start
 *
 * Sends a verification code to the mobile number recorded at signup. The
 * number itself is not accepted from the client here — verifying a number the
 * applicant did not register would defeat the one-account-per-mobile rule.
 */
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { RULES } from "@/lib/ratelimit";
import { agents } from "@/db/schema";
import { currentAgent } from "@/lib/agent";
import { startVerification } from "@/lib/otp";

export const dynamic = "force-dynamic";

export const POST = handler(
  authedRoute({ name: "payouts.mobile.start", limit: RULES.signup }, async (ctx) => {
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    const [row] = await ctx.tx
      .select({ mobile: agents.mobile })
      .from(agents)
      .where(eq(agents.id, agent.id))
      .limit(1);

    const { expiresInSeconds } = await startVerification(agent.id, row.mobile);

    return ok(ctx, {
      sent: true,
      // Masked so the response confirms the number without restating it.
      mobile: `••••••${row.mobile.slice(-4)}`,
      expiresInSeconds,
    });
  }),
);

export const OPTIONS = preflight;
