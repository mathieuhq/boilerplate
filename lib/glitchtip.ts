import * as Sentry from "@sentry/nextjs";

type CaptureUnexpectedErrorOptions = {
  extra?: Record<string, unknown>;
};

export function getGlitchTipDsn() {
  return process.env.NEXT_PUBLIC_GLITCHTIP_DSN;
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
