import type { NextConfig } from 'next';

const config: NextConfig = {
  // The demo database runs Postgres compiled to WebAssembly. It loads its own
  // .wasm and data files at runtime, so it must not be bundled, and the files
  // must ride along with every server route that can reach it.
  // Register photos are shrunk in the browser to well under this.
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  serverExternalPackages: ['@electric-sql/pglite'],
  outputFileTracingIncludes: {
    '/**': ['./supabase/**/*.sql', '../../node_modules/@electric-sql/pglite/dist/**/*'],
  },
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
