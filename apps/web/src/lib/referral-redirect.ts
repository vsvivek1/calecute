/**
 * Where an invite link sends a visitor. Pure, so the branching can be read
 * in one place and the route handler stays a thin wrapper.
 *
 *   Android + product has a Play listing  -> Play, with the code in the
 *                                            install referrer
 *   product has a web URL                 -> that URL, ?ref=<CODE>
 *   product known, nothing configured     -> /apps/<slug>?ref=<CODE>
 *   unknown app                           -> /?ref=<CODE>
 */
import type { PublicProduct } from "@/lib/api/client";

export function referralTarget(input: {
  code: string;
  app: string | null;
  product: PublicProduct | null;
  isAndroid: boolean;
  origin: string;
}): URL {
  const { code, app, product, isAndroid } = input;

  if (product?.playUrl && isAndroid) {
    const url = new URL(product.playUrl);
    // Play hands `ref=<CODE>` to the app on first launch (Install Referrer API).
    url.searchParams.set("referrer", `ref=${code}`);
    return url;
  }

  if (product?.webUrl) {
    const url = new URL(product.webUrl);
    url.searchParams.set("ref", code);
    return url;
  }

  const path = product || app ? `/apps/${encodeURIComponent((product?.slug ?? app) as string)}` : "/";
  const url = new URL(path, input.origin);
  url.searchParams.set("ref", code);
  return url;
}
