/**
 * GET /api/v1/me/export
 *
 * DPDP data portability: everything held about the caller, in one JSON
 * document. PAN and bank account are represented by their masks only — the
 * plaintext is not returned even to the person it belongs to over an API,
 * because doing so would put it in browser caches and proxy logs.
 */
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import {
  agentQualifications,
  agents,
  payoutProfiles,
  users,
} from "@/db/schema";
import { maskAccountNumber, maskPan } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "me.export" }, async (ctx) => {
    const [user] = await ctx.tx
      .select()
      .from(users)
      .where(eq(users.id, ctx.actor.userId))
      .limit(1);

    const [agent] = await ctx.tx
      .select()
      .from(agents)
      .where(eq(agents.userId, ctx.actor.userId))
      .limit(1);

    const qualifications = agent
      ? (
          await ctx.tx
            .select()
            .from(agentQualifications)
            .where(eq(agentQualifications.agentId, agent.id))
            .limit(1)
        )[0]
      : null;

    const payout = agent
      ? (
          await ctx.tx
            .select({
              panStatus: payoutProfiles.panStatus,
              panLast4: payoutProfiles.panLast4,
              bankAccountLast4: payoutProfiles.bankAccountLast4,
              bankIfsc: payoutProfiles.bankIfsc,
              bankHolderName: payoutProfiles.bankHolderName,
              upiId: payoutProfiles.upiId,
              updatedAt: payoutProfiles.updatedAt,
            })
            .from(payoutProfiles)
            .where(eq(payoutProfiles.agentId, agent.id))
            .limit(1)
        )[0]
      : null;

    return ok(ctx, {
      generatedAt: new Date().toISOString(),
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
          }
        : null,
      agent: agent
        ? {
            agentCode: agent.agentCode,
            status: agent.status,
            mobile: agent.mobile,
            occupation: agent.occupation,
            districtId: agent.districtId,
            localBodyId: agent.localBodyId,
            wardId: agent.wardId,
            termsVersion: agent.termsVersion,
            termsAcceptedAt: agent.termsAcceptedAt,
            privacyConsentAt: agent.privacyConsentAt,
            createdAt: agent.createdAt,
          }
        : null,
      qualifications: qualifications ?? null,
      payout: payout
        ? {
            panStatus: payout.panStatus,
            pan: maskPan(payout.panLast4),
            bankAccount: maskAccountNumber(payout.bankAccountLast4),
            bankIfsc: payout.bankIfsc,
            bankHolderName: payout.bankHolderName,
            upiId: payout.upiId,
            updatedAt: payout.updatedAt,
          }
        : null,
    });
  }),
);

export const OPTIONS = preflight;
