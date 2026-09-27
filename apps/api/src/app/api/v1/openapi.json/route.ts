/**
 * GET /api/v1/openapi.json
 *
 * Serves the contract from the running deployment, so a client generates types
 * against the API it will actually call rather than a file someone remembered
 * to commit.
 */
import type { NextRequest } from "next/server";
import { handler, preflight } from "@/lib/http";
import { buildSpec } from "@/openapi/spec";

export const dynamic = "force-dynamic";

export const GET = handler(async (request: NextRequest) => {
  const origin = request.nextUrl.origin;
  return Response.json(buildSpec(`${origin}/api/v1`), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Safe to cache briefly: it only changes on deploy.
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

export const OPTIONS = preflight;
