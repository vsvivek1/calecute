/**
 * Safe interpolation of JavaScript values into raw SQL fragments.
 *
 * Why this exists
 * ---------------
 * postgres.js infers a parameter's Postgres type with `value instanceof Date`.
 * Route handlers run in a different module context from the driver, so a `Date`
 * constructed inside a handler is NOT `instanceof Date` as far as the driver is
 * concerned. Inference falls through, the raw object reaches the wire
 * serializer, and the request dies with:
 *
 *   TypeError: The "string" argument must be of type string ...
 *              Received an instance of Date
 *
 * It fails only for a `Date` interpolated into a RAW fragment. Anywhere drizzle
 * knows the column type — `eq(table.createdAt, someDate)` — drizzle converts the
 * value itself and the problem does not arise. So this is specifically about
 * hand-written `sql` fragments and queries on the raw connection.
 *
 * The fix is to stop relying on inference: send an ISO 8601 string and tell
 * Postgres what it is. Correct in every realm, and explicit at the call site.
 */
import { sql, type SQL } from "drizzle-orm";

/** A timestamp, as an explicitly cast ISO string. */
export function ts(value: Date): SQL {
  return sql`${value.toISOString()}::timestamptz`;
}

/** The same, for a query on the raw postgres.js connection. */
export function tsString(value: Date): string {
  return value.toISOString();
}
