/**
 * GET /api/v1/admin/audit-log
 *
 * SUPER_ADMIN only. Cursor paginated, newest first, filterable by actor,
 * action and entity.
 *
 * There is no write endpoint. Entries are written by the actions themselves,
 * inside the same transaction as the change they describe.
 */
import { z } from "zod";
import { and, desc, eq, lt, or } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { SUPER_ONLY } from "@/lib/auth/context";
import { parseQuery } from "@/lib/validation";
import { buildPage, decodeCursor, paginationSchema } from "@/lib/pagination";
import { auditLog, users } from "@/db/schema";

export const dynamic = "force-dynamic";

const querySchema = paginationSchema.extend({
  actorUserId: z.coerce.number().int().positive().optional(),
  action: z.string().trim().max(60).optional(),
  entityType: z.string().trim().max(40).optional(),
  entityId: z.string().trim().max(60).optional(),
});

export const GET = handler(
  authedRoute({ name: "admin.auditLog", roles: SUPER_ONLY }, async (ctx) => {
    const query = parseQuery(ctx.url, querySchema);
    const cursor = decodeCursor(query.cursor);

    const rows = await ctx.tx
      .select({
        id: auditLog.id,
        createdAt: auditLog.createdAt,
        actorUserId: auditLog.actorUserId,
        actorEmail: users.email,
        actorRole: auditLog.actorRole,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        before: auditLog.before,
        after: auditLog.after,
        ipPrefix: auditLog.ipPrefix,
      })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.actorUserId))
      .where(
        and(
          query.actorUserId ? eq(auditLog.actorUserId, query.actorUserId) : undefined,
          query.action ? eq(auditLog.action, query.action) : undefined,
          query.entityType ? eq(auditLog.entityType, query.entityType) : undefined,
          query.entityId ? eq(auditLog.entityId, query.entityId) : undefined,
          cursor
            ? or(
                lt(auditLog.createdAt, new Date(cursor.k)),
                and(
                  eq(auditLog.createdAt, new Date(cursor.k)),
                  lt(auditLog.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(query.limit + 1);

    return ok(
      ctx,
      buildPage(rows, query.limit, (row) => ({
        k: row.createdAt.toISOString(),
        id: row.id,
      })),
    );
  }),
);

export const OPTIONS = preflight;
