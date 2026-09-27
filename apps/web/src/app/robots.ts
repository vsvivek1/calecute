/**
 * robots.txt — the site had none, which returned 404.
 *
 * Not fatal on its own, but Google's OAuth verification fetches the privacy
 * policy and terms with a crawler, and a missing robots.txt is one more reason
 * for that fetch to be treated as untrusted. It also matters for the
 * recruitment page, which is meant to be findable.
 *
 * The authenticated areas are excluded: an application form and a dashboard
 * have no business in an index, and they redirect to sign-in anyway.
 */
import type { MetadataRoute } from "next";

const ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://calecutech.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/admin",
          "/admin/",
          "/agents/dashboard",
          "/agents/dashboard/",
          "/agents/signup",
          "/agents/signup/",
        ],
      },
    ],
    sitemap: `${ORIGIN}/sitemap.xml`,
  };
}
