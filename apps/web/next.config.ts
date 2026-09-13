import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
