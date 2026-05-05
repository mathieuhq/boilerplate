import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const hasGlitchTipSourceMapConfig = Boolean(
  process.env.GLITCHTIP_AUTH_TOKEN &&
  process.env.GLITCHTIP_ORG &&
  process.env.GLITCHTIP_PROJECT,
);

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  telemetry: false,
  org: process.env.GLITCHTIP_ORG,
  project: process.env.GLITCHTIP_PROJECT,
  authToken: process.env.GLITCHTIP_AUTH_TOKEN,
  widenClientFileUpload: hasGlitchTipSourceMapConfig,
  silent: !hasGlitchTipSourceMapConfig || !process.env.CI,
  sentryUrl: process.env.GLITCHTIP_URL ?? "https://app.glitchtip.com",
  sourcemaps: {
    disable: !hasGlitchTipSourceMapConfig,
  },
});
