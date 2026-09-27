/**
 * POST /api/v1/admin/messages — message agents, filtered by geography or status
 * GET  /api/v1/admin/messages — what has been sent
 *
 * The message is stored with the filter that selected its recipients, and one
 * row per recipient. Nothing is dispatched to SMS or email: no provider is
 * configured, so messages appear in the agent's dashboard and the Android app's
 * inbox. See README — Before going live.
 */
import { z } from "zod";
import { desc, sql } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { ADMIN_ROLES } from "@/lib/auth/context";
import { parseBody, geoIdSchema } from "@/lib/validation";
import { RULES } from "@/lib/ratelimit";
import { ApiError } from "@/lib/errors";
import { agentMessageRecipients, agentMessages } from "@/db/schema";
import { record } from "@/lib/audit";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "admin.messages.list", roles: ADMIN_ROLES }, async (ctx) => {
    const rows = await ctx.tx
      .select()
      .from(agentMessages)
      .orderBy(desc(agentMessages.createdAt))
      .limit(100);
    return ok(ctx, { data: rows });
  }),
);

const bodySchema = z.object({
  subject: z.string().trim().min(3).max(160),
  // Malayalam first, matching every other agent-facing surface.
  bodyMl: z.string().trim().max(4000).nullish(),
  bodyEn: z.string().trim().max(4000).nullish(),
  audience: z
    .object({
      districtId: geoIdSchema.optional(),
      localBodyId: geoIdSchema.optional(),
      status: z
        .enum(["PENDING_REVIEW", "APPROVED", "SUSPENDED", "REJECTED", "WAITLISTED"])
        .optional(),
      noSalesAfterDays: z.union([z.literal(30), z.literal(60), z.literal(90)]).optional(),
    })
    .default({}),
  maxRecipients: z.number().int().min(1).max(20000).default(5000),
});

export const POST = handler(
  authedRoute(
    { name: "admin.messages.send", roles: ADMIN_ROLES, limit: RULES.write },
    async (ctx) => {
      const body = await parseBody(ctx.request, bodySchema);

      if (!body.bodyMl && !body.bodyEn) {
        throw new ApiError(
          "VALIDATION_FAILED",
          "Provide a message body in Malayalam, English, or both",
        );
      }

      // Recipients are resolved inside the RLS transaction, so a district admin
      // sending to "all agents" reaches only their own districts.
      const matched = (await ctx.tx.execute(sql`
        SELECT a.id FROM agents a
         WHERE 1 = 1
           ${body.audience.districtId ? sql`AND a.district_id = ${body.audience.districtId}` : sql``}
           ${body.audience.localBodyId ? sql`AND a.local_body_id = ${body.audience.localBodyId}` : sql``}
           ${body.audience.status ? sql`AND a.status = ${body.audience.status}::agent_status` : sql``}
           ${
             body.audience.noSalesAfterDays
               ? sql`AND a.first_sale_at IS NULL
                     AND a.created_at <= now() - (${body.audience.noSalesAfterDays} || ' days')::interval`
               : sql``
           }
         LIMIT ${body.maxRecipients + 1}
      `)) as unknown as { id: number }[];

      if (matched.length > body.maxRecipients) {
        throw new ApiError(
          "UNPROCESSABLE",
          `Filter matches more than maxRecipients (${body.maxRecipients}). Narrow it or raise the limit deliberately.`,
        );
      }

      const [message] = await ctx.tx
        .insert(agentMessages)
        .values({
          senderUserId: ctx.actor.userId,
          subject: body.subject,
          bodyMl: body.bodyMl ?? null,
          bodyEn: body.bodyEn ?? null,
          audienceFilter: body.audience,
          recipientCount: matched.length,
        })
        .returning({ id: agentMessages.id });

      if (matched.length > 0) {
        await ctx.tx.insert(agentMessageRecipients).values(
          matched.map((row) => ({ messageId: message.id, agentId: row.id })),
        );
      }

      await record(ctx.tx, {
        request: ctx.request,
        actor: ctx.actor,
        action: "message.sent",
        entityType: "agent_message",
        entityId: message.id,
        after: {
          subject: body.subject,
          audience: body.audience,
          recipientCount: matched.length,
        },
      });

      return ok(
        ctx,
        {
          messageId: message.id,
          recipientCount: matched.length,
          delivery: "IN_APP_ONLY",
          note: "No SMS or email provider is configured. Recipients see this in their dashboard.",
        },
        201,
      );
    },
  ),
);

export const OPTIONS = preflight;
