import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recallio: LSS Kerala Exam Prep does the same under public/lss-recallio/
  // (published by the lss-recallio repo's web/publish_to_calecutech.py).
  // Recallio: Plus One Science and Plus Two Science follow the same pattern
  // (published by the recallio-hss repo's web/publish_to_calecutech.py).
  // Recallio: USS Kerala Exam Prep keeps its policy pages as plain static
  // files under public/uss-recallio/ (published by the uss-recallio repo's
  // web/publish_to_calecutech.py). Next does not resolve a folder to its
  // index.html, so each clean URL is mapped to its file here.
  // Find My Bus (vsvivek1/findbus) keeps its policy pages under public/findmybus/.
  async rewrites() {
    const pages = "privacy|terms|child-safety|refunds|delete-account|support";
    return [
      { source: "/uss-recallio", destination: "/uss-recallio/index.html" },
      { source: `/uss-recallio/:slug(${pages})`, destination: "/uss-recallio/:slug/index.html" },
      { source: "/lss-recallio", destination: "/lss-recallio/index.html" },
      { source: `/lss-recallio/:slug(${pages})`, destination: "/lss-recallio/:slug/index.html" },
      { source: "/plus-one-science", destination: "/plus-one-science/index.html" },
      { source: `/plus-one-science/:slug(${pages})`, destination: "/plus-one-science/:slug/index.html" },
      { source: "/plus-two-science", destination: "/plus-two-science/index.html" },
      { source: `/plus-two-science/:slug(${pages})`, destination: "/plus-two-science/:slug/index.html" },
      { source: "/findmybus", destination: "/findmybus/index.html" },
      { source: `/findmybus/:slug(${pages})`, destination: "/findmybus/:slug/index.html" },
    ];
  },
  async redirects() {
    return [
      {
        // Payout setup moved into the profile page. Anyone holding the old
        // link — a bookmark, a WhatsApp forward — lands where it went.
        source: "/agents/dashboard/payouts",
        destination: "/agents/dashboard/profile",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
