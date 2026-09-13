/**
 * GET /agents/dashboard/qr — proxies the agent's referral QR.
 *
 * The API serves the image behind bearer auth, and an <img src> cannot send an
 * Authorization header. So this route attaches the token from the session
 * cookie and streams the result. The alternative — an unauthenticated QR
 * endpoint keyed by agent code — would let anyone enumerate agents.
 */
import type { NextRequest } from "next/server";
import { currentAccessToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = await currentAccessToken();
  if (!token) return new Response("Unauthorized", { status: 401 });

  const base = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  const format = request.nextUrl.searchParams.get("format") === "svg" ? "svg" : "png";

  const upstream = await fetch(`${base}/agent/referral/qr?format=${format}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new Response("Not available", { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ??
        (format === "svg" ? "image/svg+xml" : "image/png"),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
