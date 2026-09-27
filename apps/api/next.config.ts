import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The API deployment renders no UI. Keeping React strict mode on costs
  // nothing and surfaces mistakes in the few RSC-adjacent files that exist.
  reactStrictMode: true,
  // `postgres` opens raw sockets; it must not be bundled into the server build.
  serverExternalPackages: ["postgres"],
  poweredByHeader: false,
};

export default nextConfig;
