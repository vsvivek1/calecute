/**
 * GET /api/v1/agent/referral
 *
 * Code, link, QR and a pre-filled WhatsApp share. Kept separate from the
 * dashboard so the share sheet can refresh it without refetching earnings.
 */
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { currentAgent, referralLink, whatsappShareLink } from "@/lib/agent";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "agent.referral" }, async (ctx) => {
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);
    return ok(ctx, {
      code: agent.agentCode,
      link: referralLink(agent.agentCode),
      qrUrl: "/api/v1/agent/referral/qr",
      qrSvgUrl: "/api/v1/agent/referral/qr?format=svg",
      whatsappShareUrl: whatsappShareLink(agent.agentCode),
    });
  }),
);

export const OPTIONS = preflight;
