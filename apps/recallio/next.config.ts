import type { NextConfig } from 'next';

const config: NextConfig = {
  // Two hostnames, one deployment. The subdomain chooses the view; the
  // database decides what that view is allowed to show.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default config;
