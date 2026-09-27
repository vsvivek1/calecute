import type { NextRequest } from "next/server";
import { handler, json, preflight } from "@/lib/http";
import { sql as connection } from "@/db/client";

export const dynamic = "force-dynamic";

/** Liveness plus a real database round trip, for the deploy check. */
export const GET = handler(async (request: NextRequest) => {
  let database = "ok";
  try {
    await connection()`SELECT 1`;
  } catch (error) {
    database = error instanceof Error ? `error: ${error.message}` : "error";
  }
  return json(
    request,
    { status: database === "ok" ? "ok" : "degraded", version: "v1", database },
    { status: database === "ok" ? 200 : 503 },
  );
});

export const OPTIONS = preflight;
