/**
 * GET /api/v1/geography/local-bodies
 *
 * The searchable panchayat / municipality picker. Public, because the signup
 * form renders before sign-in.
 *
 * Query: districtId, q, type, onlyOpen, limit, cursor
 *
 * Municipalities and corporations come back in the same list as gram
 * panchayats, distinguished by `type`. The client never branches on which
 * hierarchy branch a row came from.
 */
import { z } from "zod";
import { handler, preflight } from "@/lib/http";
import { publicRoute, ok } from "@/lib/route";
import { parseQuery, geoIdSchema } from "@/lib/validation";
import { searchLocalBodies } from "@/lib/geography";
import { decodeCursor, encodeCursor, MAX_PAGE_SIZE } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  districtId: geoIdSchema.optional(),
  q: z.string().trim().max(80).optional(),
  type: z.enum(["GRAM_PANCHAYAT", "MUNICIPALITY", "CORPORATION"]).optional(),
  onlyOpen: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(50),
  cursor: z.string().optional(),
});

export const GET = handler(
  publicRoute({ name: "geo.localBodies" }, async (ctx) => {
    const query = parseQuery(ctx.url, querySchema);
    const cursor = decodeCursor(query.cursor);

    const rows = await searchLocalBodies(ctx.tx, {
      districtId: query.districtId,
      query: query.q,
      type: query.type,
      onlyOpen: query.onlyOpen,
      limit: query.limit + 1,
      offsetId: cursor?.id,
    });

    const hasNextPage = rows.length > query.limit;
    const data = hasNextPage ? rows.slice(0, query.limit) : rows;
    const last = data[data.length - 1];

    return ok(ctx, {
      data,
      pageInfo: {
        hasNextPage,
        nextCursor:
          hasNextPage && last ? encodeCursor({ k: last.nameEn, id: last.id }) : null,
        limit: query.limit,
      },
    });
  }),
);

export const OPTIONS = preflight;
