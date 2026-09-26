import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Recallio: USS Kerala Exam Prep keeps its policy pages as plain static
  // files under public/uss-recallio/. Next does not resolve a folder to its
  // index.html, so each clean URL is mapped to its file here.
  async rewrites() {
    const pages = "privacy|terms|child-safety|refunds|delete-account|support";
    return [
      { source: "/uss-recallio", destination: "/uss-recallio/index.html" },
      { source: `/uss-recallio/:slug(${pages})`, destination: "/uss-recallio/:slug/index.html" },
    ];
  },
};

export default nextConfig;
