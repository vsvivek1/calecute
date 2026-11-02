/**
 * GET /api/v1/members/{externalRef}
 *
 * The same shape POST /members returns, for an app refreshing a member's stats
 * without re-sending their profile. 404 until POST /members has been called
 * for that user.
 */
import { handler, preflight } from "@/lib/http";
import { ok, serviceRoute } from "@/lib/route";
import { ApiError } from "@/lib/errors";
import { RULES } from "@/lib/ratelimit";
import { findMember, memberResponse } from "@/lib/members";

export const dynamic = "force-dynamic";

export const GET = handler(async (request, context) => {
  const { externalRef } = await (
    context as unknown as { params: Promise<{ externalRef: string }> }
  ).params;
  const ref = decodeURIComponent(externalRef ?? "").trim();
  if (!ref || ref.length > 120) {
    throw new ApiError("VALIDATION_FAILED", "Bad member reference");
  }

  return serviceRoute(
    { name: "members.read", kinds: ["client", "server"], limit: RULES.service },
    async (ctx) => {
      const product = ctx.product!;
      const member = await findMember(ctx.tx, product, ref);
      if (!member) throw new ApiError("NOT_FOUND", "No member with that reference");
      return ok(ctx, await memberResponse(ctx.tx, ctx.request.url, product, member));
    },
  )(request);
});

export const OPTIONS = preflight;
