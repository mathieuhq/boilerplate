import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "pushlab",
  telemetry: false,
  disableLogger: true,
  project: "boilerplate",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  automaticVercelMonitors: false,
  sourcemaps: {
    disable: true,
  },
});
