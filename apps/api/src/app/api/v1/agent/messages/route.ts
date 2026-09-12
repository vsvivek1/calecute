/**
 * GET /api/v1/agent/messages
 *
 * The agent's inbox. Malayalam body first; the client renders whichever is
 * present.
 */
import { and, desc, eq, lt, or } from "drizzle-orm";
import { handler, preflight } from "@/lib/http";
import { authedRoute, ok } from "@/lib/route";
import { parseQuery } from "@/lib/validation";
import { buildPage, decodeCursor, paginationSchema } from "@/lib/pagination";
import { agentMessageRecipients, agentMessages } from "@/db/schema";
import { currentAgent } from "@/lib/agent";

export const dynamic = "force-dynamic";

export const GET = handler(
  authedRoute({ name: "agent.messages" }, async (ctx) => {
    const query = parseQuery(ctx.url, paginationSchema);
    const cursor = decodeCursor(query.cursor);
    const agent = await currentAgent(ctx.tx, ctx.actor.userId);

    const rows = await ctx.tx
      .select({
        id: agentMessages.id,
        subject: agentMessages.subject,
        bodyMl: agentMessages.bodyMl,
        bodyEn: agentMessages.bodyEn,
        createdAt: agentMessages.createdAt,
        readAt: agentMessageRecipients.readAt,
      })
      .from(agentMessageRecipients)
      .innerJoin(agentMessages, eq(agentMessages.id, agentMessageRecipients.messageId))
      .where(
        and(
          eq(agentMessageRecipients.agentId, agent.id),
          cursor
            ? or(
                lt(agentMessages.createdAt, new Date(cursor.k)),
                and(
                  eq(agentMessages.createdAt, new Date(cursor.k)),
                  lt(agentMessages.id, cursor.id),
                ),
              )
            : undefined,
        ),
      )
      .orderBy(desc(agentMessages.createdAt), desc(agentMessages.id))
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
