import * as Sentry from "@sentry/tanstackstart-react";

type CaptureUnexpectedErrorOptions = {
  extra?: Record<string, unknown>;
};

export function getGlitchTipDsn() {
  if (typeof window === "undefined") return process.env.VITE_GLITCHTIP_DSN;

  return import.meta.env.VITE_GLITCHTIP_DSN;
}

export function isGlitchTipConfigured() {
  return Boolean(getGlitchTipDsn());
}

export function getGlitchTipTracesSampleRate() {
  return process.env.NODE_ENV === "production" ? 0.01 : 1.0;
}

export function captureUnexpectedError(
  error: unknown,
  options?: CaptureUnexpectedErrorOptions,
) {
  if (!isGlitchTipConfigured()) return;

  Sentry.captureException(error, options);
}
