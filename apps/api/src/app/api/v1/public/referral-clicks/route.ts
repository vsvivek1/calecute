/**
 * POST /api/v1/public/referral-clicks
 *
 * A click counter behind the /r/{code} redirect on the website. Public and
 * fire-and-forget: the redirect does not wait on it. Stores the code, the
 * product if named, a source tag and a hash of the truncated client prefix —
 * no user id and no full IP, see lib/net.ts.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { anonymousWriteRoute, ok } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { hashFingerprint, ipPrefix } from "@/lib/net";
import { products, referralClicks } from "@/db/schema";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().trim().toUpperCase().min(3).max(40).regex(/^[A-Z0-9-]+$/),
  app: z.string().trim().toLowerCase().max(80).regex(/^[a-z0-9-]*$/).optional(),
  source: z.string().trim().max(40).optional(),
});

export const POST = handler(
  anonymousWriteRoute({ name: "public.referral-clicks", limit: RULES.analytics }, async (ctx) => {
    const body = await parseBody(ctx.request, bodySchema);

    let productId: number | null = null;
    if (body.app) {
      const [product] = await ctx.tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, body.app))
        .limit(1);
      productId = product?.id ?? null;
    }

    await ctx.tx.insert(referralClicks).values({
      code: body.code,
      productId,
      source: body.source ?? null,
      ipHash: hashFingerprint(ipPrefix(ctx.request)),
    });

    return ok(ctx, { accepted: true }, 202);
  }),
);

export const OPTIONS = preflight;
