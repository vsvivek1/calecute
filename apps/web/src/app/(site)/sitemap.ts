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
  // Recallio: USS Kerala Exam Prep. Static pages under public/uss-recallio,
  // listed because Play Console checks the privacy and delete-account URLs.
  { path: "/uss-recallio", priority: 0.6, changeFrequency: "monthly" },
  { path: "/uss-recallio/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/uss-recallio/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/uss-recallio/child-safety", priority: 0.4, changeFrequency: "yearly" },
  { path: "/uss-recallio/refunds", priority: 0.4, changeFrequency: "yearly" },
  { path: "/uss-recallio/support", priority: 0.4, changeFrequency: "yearly" },
  { path: "/uss-recallio/delete-account", priority: 0.4, changeFrequency: "yearly" },
  // Recallio: LSS Kerala Exam Prep. Same layout as USS, under public/lss-recallio.
  { path: "/lss-recallio", priority: 0.6, changeFrequency: "monthly" },
  { path: "/lss-recallio/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/lss-recallio/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/lss-recallio/child-safety", priority: 0.4, changeFrequency: "yearly" },
  { path: "/lss-recallio/refunds", priority: 0.4, changeFrequency: "yearly" },
  { path: "/lss-recallio/support", priority: 0.4, changeFrequency: "yearly" },
  { path: "/lss-recallio/delete-account", priority: 0.4, changeFrequency: "yearly" },
  // Recallio: Plus One Science. Static pages under public/plus-one-science.
  { path: "/plus-one-science", priority: 0.6, changeFrequency: "monthly" },
  { path: "/plus-one-science/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-one-science/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-one-science/child-safety", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-one-science/refunds", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-one-science/support", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-one-science/delete-account", priority: 0.4, changeFrequency: "yearly" },
  // Recallio: Plus Two Science. Static pages under public/plus-two-science.
  { path: "/plus-two-science", priority: 0.6, changeFrequency: "monthly" },
  { path: "/plus-two-science/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-two-science/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-two-science/child-safety", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-two-science/refunds", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-two-science/support", priority: 0.4, changeFrequency: "yearly" },
  { path: "/plus-two-science/delete-account", priority: 0.4, changeFrequency: "yearly" },
  // Find My Bus. Static pages under public/findmybus.
  { path: "/findmybus", priority: 0.6, changeFrequency: "monthly" },
  { path: "/findmybus/privacy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/findmybus/terms", priority: 0.4, changeFrequency: "yearly" },
  { path: "/findmybus/support", priority: 0.4, changeFrequency: "yearly" },
  { path: "/findmybus/delete-account", priority: 0.4, changeFrequency: "yearly" },
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
