/**
 * Proxies a CSV or PDF export, attaching the bearer token.
 *
 * A download is a plain link, and a link cannot carry an Authorization header —
 * so the alternative would be putting a token in a URL, where it lands in
 * browser history, referrer headers and server logs. This reads the token from
 * the httpOnly session cookie instead and streams the file through.
 */
import type { NextRequest } from "next/server";
import { currentAccessToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const token = await currentAccessToken();
  if (!token) return new Response("Unauthorized", { status: 401 });

  const base = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

  // Only known-safe parameters are forwarded; the slug is path-encoded.
  const allowed = ["format", "districtId", "blockId", "localBodyId", "wardId", "from", "to", "limit"];
  const forwarded = new URLSearchParams();
  for (const key of allowed) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) forwarded.set(key, value);
  }

  const upstream = await fetch(
    `${base}/admin/reports/${encodeURIComponent(slug)}?${forwarded}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );

  if (!upstream.ok) {
    return new Response("Export failed", { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ?? `attachment; filename="${slug}"`,
      "Cache-Control": "no-store",
    },
  });
}
