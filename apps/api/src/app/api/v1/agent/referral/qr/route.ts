/**
 * GET /api/v1/agent/referral/qr[?format=svg]
 *
 * The agent's referral QR, rendered server-side so the Android app and the web
 * client get the same image and neither ships a QR library.
 *
 * Returns an image, not JSON — the one endpoint in the API that does. It is
 * still client-agnostic: both clients display it the same way.
 */
import QRCode from "qrcode";
import { handler, preflight } from "@/lib/http";
import { authedRoute } from "@/lib/route";
import { currentAgent, referralLink } from "@/lib/agent";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "agent.referral.qr" }, async (ctx) => {
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);
    const link = referralLink(agent.agentCode);
    const format = ctx.url.searchParams.get("format") === "svg" ? "svg" : "png";

    // Error correction M keeps the code readable when it is printed small or
    // re-photographed off someone else's screen, which is how these spread.
    const options = { errorCorrectionLevel: "M" as const, margin: 2, width: 512 };

    if (format === "svg") {
      const svg = await QRCode.toString(link, { ...options, type: "svg" });
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "private, max-age=3600",
          "Content-Disposition": `inline; filename="${agent.agentCode}.svg"`,
          ...ctx.rateHeaders,
        },
      });
    }

    const png = await QRCode.toBuffer(link, { ...options, type: "png" });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
        "Content-Disposition": `inline; filename="${agent.agentCode}.png"`,
        ...ctx.rateHeaders,
      },
    });
  }),
);

export const OPTIONS = preflight;
