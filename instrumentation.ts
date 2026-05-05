import { isGlitchTipConfigured } from "@/lib/glitchtip";
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (!isGlitchTipConfigured()) return;

  if (process.env.NEXT_RUNTIME === "nodejs")
    await import("./sentry.server.config");

  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

export const onRequestError: typeof Sentry.captureRequestError = (...args) => {
  if (!isGlitchTipConfigured()) return;

  return Sentry.captureRequestError(...args);
};
