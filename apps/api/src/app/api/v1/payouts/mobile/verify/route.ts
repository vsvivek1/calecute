/**
 * POST /api/v1/payouts/mobile/verify
 *
 * Confirms the code and stamps `mobileVerifiedAt`. Together with a verified
 * PAN this is what unblocks a payout.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { agents } from "@/db/schema";
import { currentAgent } from "@/lib/agent";
import { checkVerification } from "@/lib/otp";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ code: z.string().trim().regex(/^\d{6}$/) });

export const POST = handler(
  authedRoute({ name: "payouts.mobile.verify", limit: RULES.write }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    const [row] = await ctx.tx
      .select({ mobile: agents.mobile })
      .from(agents)
      .where(eq(agents.id, agent.id))
      .limit(1);

    await checkVerification(agent.id, row.mobile, body.code);

    await ctx.tx
      .update(agents)
      .set({ mobileVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(agents.id, agent.id));

    return ok(ctx, { verified: true });
  }),
);

export const OPTIONS = preflight;
