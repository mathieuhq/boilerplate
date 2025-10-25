import type { NextConfig } from "next";

/**
 * Next.js application configuration
 */
const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
