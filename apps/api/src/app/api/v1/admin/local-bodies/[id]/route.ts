/**
 * PATCH /api/v1/admin/local-bodies/{id}
 *
 * Adjust the slot count, or open and close a panchayat to signups.
 *
 * Lowering the capacity below the number of agents already in place is allowed
 * and does not remove anybody — it just means no new applications. The response
 * says so explicitly so an admin is not surprised.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { localBodies } from "@/db/schema";
import { loadLocalBodyForAdmin } from "@/lib/admin";
import { record } from "@/lib/audit";
import { availabilityFor, occupiedSlots } from "@/lib/geography";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    slotCapacity: z.number().int().min(0).max(500).optional(),
    signupsOpen: z.boolean().optional(),
    reason: z.string().trim().max(500).nullish(),
  })
  .refine(
    (v) => v.slotCapacity !== undefined || v.signupsOpen !== undefined,
    { message: "Provide slotCapacity, signupsOpen, or both" },
  );

export const PATCH = handler(async (request, context) => {
  const { id } = await (context as unknown as { params: Promise<{ id: string }> })
    .params;
  const localBodyId = geoIdSchema.safeParse(id);
  if (!localBodyId.success) {
    throw new ApiError("VALIDATION_FAILED", "Bad local body id");
  }

  return authedRoute(
    { name: "admin.localBody.patch", roles: ADMIN_ROLES, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);
      const before = await loadLocalBodyForAdmin(ctx.tx, localBodyId.data);
      const filled = await occupiedSlots(ctx.tx, before.id);

      const [after] = await ctx.tx
        .update(localBodies)
        .set({
          ...(body.slotCapacity !== undefined
            ? { slotCapacity: body.slotCapacity }
            : {}),
          ...(body.signupsOpen !== undefined
            ? { signupsOpen: body.signupsOpen }
            : {}),
        })
        .where(eq(localBodies.id, before.id))
        .returning();

      if (!after) {
        throw new ApiError(
          "OUT_OF_DISTRICT_SCOPE",
          "That local body is outside the districts assigned to you",
        );
      }

      if (body.slotCapacity !== undefined && body.slotCapacity !== before.slotCapacity) {
        await record(ctx.tx, {
          request: ctx.request,
          actor: ctx.actor,
          action: "local_body.slots_changed",
          entityType: "local_body",
          entityId: after.id,
          before: { slotCapacity: before.slotCapacity },
          after: { slotCapacity: after.slotCapacity, reason: body.reason ?? null },
        });
      }

      if (body.signupsOpen !== undefined && body.signupsOpen !== before.signupsOpen) {
        await record(ctx.tx, {
          request: ctx.request,
          actor: ctx.actor,
          action: after.signupsOpen
            ? "local_body.signups_opened"
            : "local_body.signups_closed",
          entityType: "local_body",
          entityId: after.id,
          before: { signupsOpen: before.signupsOpen },
          after: { signupsOpen: after.signupsOpen, reason: body.reason ?? null },
        });
      }

      return ok(ctx, {
        localBody: {
          id: after.id,
          nameEn: after.nameEn,
          nameMl: after.nameMl,
          slotCapacity: after.slotCapacity,
          signupsOpen: after.signupsOpen,
        },
        availability: await availabilityFor(ctx.tx, after.id),
        note:
          body.slotCapacity !== undefined && body.slotCapacity < filled
            ? `Capacity is now below the ${filled} agents already in place. No agent has been removed; no new applications will be accepted.`
            : null,
      });
    },
  )(request);
});

export const OPTIONS = preflight;
