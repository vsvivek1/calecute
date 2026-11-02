/**
 * GET /api/v1/public/qr?code=RF-ABC234&app=quizkerala
 *
 * The QR for a member's invite link, rendered server-side so no app ships a
 * QR library. Public and cacheable: the image encodes only the public link,
 * and a code that does not exist simply produces a QR to a page that says so.
 */
import QRCode from "qrcode";
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { publicRoute } from "@/lib/route";
import { parseQuery } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { userReferralLink } from "@/lib/referral";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9-]+$/),
  app: z.string().trim().toLowerCase().min(1).max(80).regex(/^[a-z0-9-]+$/),
  format: z.enum(["png", "svg"]).default("png"),
});

export const GET = handler(
  publicRoute({ name: "public.qr", limit: RULES.referralRead }, async (ctx) => {
    const query = parseQuery(ctx.url, querySchema);
    const link = userReferralLink(query.code, query.app);

    // Error correction M: readable when printed small or photographed off
    // someone else's screen, which is how these spread.
    const options = { errorCorrectionLevel: "M" as const, margin: 2, width: 512 };
    const headers = {
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      ...ctx.rateHeaders,
    };

    if (query.format === "svg") {
      const svg = await QRCode.toString(link, { ...options, type: "svg" });
      return new Response(svg, {
        headers: {
          ...headers,
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": `inline; filename="${query.code}.svg"`,
        },
      });
    }

    const png = await QRCode.toBuffer(link, { ...options, type: "png" });
    return new Response(new Uint8Array(png), {
      headers: {
        ...headers,
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${query.code}.png"`,
      },
    });
  }),
);

export const OPTIONS = preflight;
