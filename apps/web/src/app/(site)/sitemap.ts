/**
 * The public pages, for crawlers.
 *
 * Only pages a stranger can reach without signing in. The agent programme's
 * own terms and privacy pages are listed explicitly, because Google's OAuth
 * review looks for them and a page in a sitemap is easier for it to trust.
 */
import type { MetadataRoute } from "next";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";

const PATHS: Array<{ path: string; priority: number; changeFrequency: "monthly" | "yearly" | "weekly" }> = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/agents", priority: 0.9, changeFrequency: "weekly" },
  { path: "/agents/terms", priority: 0.5, changeFrequency: "yearly" },
  { path: "/agents/privacy", priority: 0.5, changeFrequency: "yearly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/services", priority: 0.6, changeFrequency: "monthly" },
  { path: "/products", priority: 0.6, changeFrequency: "monthly" },
  { path: "/products/dailydo", priority: 0.5, changeFrequency: "monthly" },
  { path: "/apps", priority: 0.5, changeFrequency: "monthly" },
  // Recallio's own pages are listed explicitly: Google's OAuth review checks
  // that the homepage, privacy policy and terms on the consent screen resolve,
  // and a page in the sitemap is easier for it to trust.
  { path: "/apps/recallio", priority: 0.6, changeFrequency: "monthly" },
  { path: "/apps/recallio/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/apps/recallio/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/apps/recallio/support", priority: 0.4, changeFrequency: "yearly" },
  { path: "/apps/recallio/delete-account", priority: 0.4, changeFrequency: "yearly" },
  { path: "/locations", priority: 0.4, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/data-deletion", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${ORIGIN}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
