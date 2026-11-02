import type { NextConfig } from 'next';

// One codebase, two builds.
//
//   web      `next build`                    — pages plus the Stripe and
//                                               licence route handlers.
//   android  `BUILD_TARGET=android next build` — a static export Capacitor
//                                               bundles into the APK. Route
//                                               handlers are `.ts` files, so
//                                               limiting pageExtensions to
//                                               `.tsx` leaves them out; the
//                                               app calls the web deployment
//                                               for them instead.
const android = process.env.BUILD_TARGET === 'android';

const config: NextConfig = android
  ? {
      output: 'export',
      env: { NEXT_PUBLIC_IS_APP: '1' },
      pageExtensions: ['tsx'],
      images: { unoptimized: true },
      trailingSlash: true,
    }
  : {
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
