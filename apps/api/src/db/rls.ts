/**
 * The only way application code reaches the database.
 *
 * Every call opens a transaction, drops to an unprivileged role, stamps the
 * caller's identity onto the transaction, and hands back a scoped query
 * interface. The policies in `drizzle/0001_rls.sql` read that identity. This is
 * why no route handler in this codebase writes a district filter by hand —
 * forgetting one returns no rows rather than someone else's rows.
 *
 * Two details that matter:
 *
 *  - `set_config(..., true)` makes each setting local to the transaction, so a
 *    pooled connection can never carry one request's identity into the next.
 *
 *  - `SET LOCAL ROLE` drops to `calecute_app`, which is neither a superuser nor
 *    the owner of any table, so the policies genuinely apply. Without it,
 *    enforcement would depend on whichever role DATABASE_URL happens to name —
 *    and a superuser connection bypasses row-level security silently, with no
 *    error to notice. See drizzle/0002_app_role.sql, and scripts/verify-rls.mts
 *    which proves the policies hold.
 */
import { sql } from "drizzle-orm";
import { db } from "./client";

export type ActorRole = "AGENT" | "DISTRICT_ADMIN" | "SUPER_ADMIN" | "PUBLIC";

export interface Actor {
  userId: number | null;
  role: ActorRole;
}

/** The anonymous caller: the recruitment page before anyone signs in. */
export const PUBLIC_ACTOR: Actor = { userId: null, role: "PUBLIC" };

/** The non-privileged role every request runs as. */
export const APP_ROLE = "calecute_app";

/**
 * A transaction-scoped query interface.
 *
 * Derived from drizzle's own transaction callback rather than written out, so it
 * cannot drift. Note this is a transaction, not a pool handle: passing the pool
 * to `drizzle()` per request is what a previous version of this file did, and it
 * fails at runtime because a postgres.js transaction object carries no options.
 */
export type ScopedDb = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Run `fn` inside a transaction scoped to `actor`.
 *
 * Throwing from `fn` rolls the transaction back, which is what makes multi-step
 * writes (take a slot, issue a code, insert the agent, record consent) atomic.
 */
export async function withRls<T>(
  actor: Actor,
  fn: (tx: ScopedDb) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    /*
     * One statement, not three.
     *
     * `SET LOCAL ROLE x` is the same thing as set_config('role', 'x', true),
     * so the privilege drop and both identity settings fit in a single round
     * trip. That matters more than it looks: the database is in Singapore and
     * the functions are in Mumbai, so each round trip costs about 55ms. Three
     * separate statements added ~110ms to every request in the product.
     *
     * The role is still a module constant rather than anything derived from a
     * request, and both identity values are bound parameters.
     */
    await tx.execute(
      sql`SELECT
            set_config('role', ${APP_ROLE}, true),
            set_config('app.user_id', ${
              actor.userId === null ? "" : String(actor.userId)
            }, true),
            set_config('app.role', ${actor.role}, true)`,
    );
    return fn(tx);
  });
}

/**
 * Escape hatch for the seed loader and the two auth operations that necessarily
 * run before any user identity exists — establishing a session and rotating a
 * refresh token.
 *
 * This does NOT drop to the application role, so it runs with the connecting
 * role's privileges and bypasses policy where that role owns the tables.
 * Deliberately verbose to type and to read in review.
 */
export async function withOwnerPrivileges<T>(
  fn: (tx: ScopedDb) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.role', 'SUPER_ADMIN', true)`);
    return fn(tx);
  });
}
