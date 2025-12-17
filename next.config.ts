import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "glitchtip",
  project: "boilerplate",

  silent: !process.env.CI,

  widenClientFileUpload: true,

  disableLogger: true,

  automaticVercelMonitors: false,

  telemetry: false,

  sourcemaps: {
    disable: true,
  },
});
