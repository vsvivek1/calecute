/**
 * The one place a database connection is created.
 *
 * Nothing outside `src/db` and `src/lib` should import this. Route handlers go
 * through `withRls`, which is the only way to get a query interface.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

declare global {
  // Reused across hot reloads in dev and across warm invocations on Fluid
  // Compute, so we do not open a new pool per request.
  var __calecuteSql: ReturnType<typeof postgres> | undefined;
}

function connection() {
  if (!globalThis.__calecuteSql) {
    globalThis.__calecuteSql = postgres(env().DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      types: {
        /**
         * int8 -> JS number.
         *
         * postgres.js returns int8 as a string by default, and `postgres.BigInt`
         * returns a JS BigInt — which JSON.stringify refuses to serialize, so it
         * blows up at the response boundary for any row that did not pass through
         * drizzle's column mapping (a raw `sql` report query, for example).
         *
         * Numbers are safe for this schema: ids are sequences, and the largest
         * money value is paise, so the ceiling is around ninety trillion rupees
         * before Number.MAX_SAFE_INTEGER is in play.
         */
        bigint: {
          to: 20,
          from: [20],
          serialize: (value: number | bigint) => String(value),
          parse: (value: string) => Number(value),
        },
      },
    });
  }
  return globalThis.__calecuteSql;
}

export const sql = connection;

export const db = drizzle(connection(), { schema });

export type Database = typeof db;
export { schema };
