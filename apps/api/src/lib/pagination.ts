/**
 * Cursor pagination, used by every list endpoint.
 *
 * Offsets are avoided deliberately: admin reports are read while signups are
 * arriving, and an offset would skip or repeat rows. The cursor encodes the
 * sort key of the last row seen, so pages stay stable.
 */
import { z } from "zod";
import { ApiError } from "./errors";

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export const paginationSchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),
});

export interface Cursor {
  /** Primary sort value, ISO timestamp or numeric string. */
  k: string;
  /** Tie-breaker: the row id. */
  id: number;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      typeof parsed?.k !== "string" ||
      typeof parsed?.id !== "number" ||
      !Number.isFinite(parsed.id)
    ) {
      throw new Error("shape");
    }
    return parsed as Cursor;
  } catch {
    throw new ApiError("INVALID_CURSOR", "Pagination cursor is not valid");
  }
}

export interface Page<T> {
  data: T[];
  pageInfo: {
    hasNextPage: boolean;
    nextCursor: string | null;
    limit: number;
  };
}

/**
 * Build the response envelope. Callers fetch `limit + 1` rows and pass them in;
 * the extra row is what tells us whether another page exists.
 */
export function buildPage<T>(
  rows: T[],
  limit: number,
  cursorOf: (row: T) => Cursor,
): Page<T> {
  const hasNextPage = rows.length > limit;
  const data = hasNextPage ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  return {
    data,
    pageInfo: {
      hasNextPage,
      nextCursor: hasNextPage && last ? encodeCursor(cursorOf(last)) : null,
      limit,
    },
  };
}
