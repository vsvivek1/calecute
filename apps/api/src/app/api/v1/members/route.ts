/**
 * POST /api/v1/members
 *
 * Called by a product app when a user signs in. Finds or creates the user's
 * invite code and returns it with the share link, QR and their referral
 * stats. Idempotent: calling it on every sign-in is the intended usage.
 *
 * `externalRef` is the app's own user id; it is namespaced as
 * `<product_slug>:<externalRef>` so two apps can never collide, and the same
 * value is what the app passes as `customerExternalRef` when that user joins
 * through somebody else's code.
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { ok, serviceRoute } from "@/lib/route";
import { parseBody } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ensureMember, memberResponse } from "@/lib/members";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  externalRef: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(200).nullish(),
  pictureUrl: z.string().trim().url().max(500).nullish(),
});

export const POST = handler(
  serviceRoute(
    { name: "members.upsert", kinds: ["client", "server"], limit: RULES.service },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);
      // Only a key reaches here: superAdmin is off, so `product` is never null.
      const product = ctx.product!;
      const { member, created } = await ensureMember(ctx.tx, product, body);
      const response = await memberResponse(ctx.tx, ctx.request.url, product, member);
      return ok(ctx, response, created ? 201 : 200);
    },
  ),
);

export const OPTIONS = preflight;
