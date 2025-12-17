import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.GLITCHTIP_DSN,

  enabled: !!process.env.GLITCHTIP_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  debug: false,
});
