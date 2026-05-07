import * as Sentry from "@sentry/tanstackstart-react";

type CaptureUnexpectedErrorOptions = {
  extra?: Record<string, unknown>;
};

let initialized = false;

function getGlitchTipDsn() {
  if (typeof window === "undefined") return process.env.VITE_GLITCHTIP_DSN;

  return import.meta.env.VITE_GLITCHTIP_DSN;
}

function isGlitchTipConfigured() {
  return Boolean(getGlitchTipDsn());
}

function isProductionRuntime() {
  if (typeof window === "undefined")
    return process.env.NODE_ENV === "production";

  return import.meta.env.PROD;
}

function getGlitchTipTracesSampleRate() {
  return isProductionRuntime() ? 0.01 : 1.0;
}

export function initGlitchTip() {
  const dsn = getGlitchTipDsn();

  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: getGlitchTipTracesSampleRate(),
  });

  initialized = true;
}

export function captureUnexpectedError(
  error: unknown,
  options?: CaptureUnexpectedErrorOptions,
) {
  if (!isGlitchTipConfigured()) return;

  initGlitchTip();
  Sentry.captureException(error, options);
}
