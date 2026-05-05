import { getGlitchTipDsn, getGlitchTipTracesSampleRate } from "@/lib/glitchtip";
import * as Sentry from "@sentry/nextjs";

const dsn = getGlitchTipDsn();

if (dsn)
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: getGlitchTipTracesSampleRate(),
  });

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
