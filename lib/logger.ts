import { Logger } from "tslog";

import { SITE_CONFIG } from "@/lib/site-config";
import * as Sentry from "@sentry/nextjs";

const tsLogger = new Logger({
  name: SITE_CONFIG.TITLE,
  minLevel: process.env.NODE_ENV === "production" ? 3 : 0,
});

type LogContext = Record<string, unknown> | Error | string;

function normalizeContext(context?: LogContext): Record<string, unknown> {
  if (!context) return {};
  if (typeof context === "string") return { detail: context };
  if (context instanceof Error)
    return { error: context, message: context.message };
  return context;
}

function extractError(context?: LogContext): Error | undefined {
  if (context instanceof Error) return context;
  if (context && typeof context === "object" && "error" in context) {
    const err = context.error;
    if (err instanceof Error) return err;
  }
  return undefined;
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    tsLogger.debug(message, normalizeContext(context)),

  info: (message: string, context?: LogContext) =>
    tsLogger.info(message, normalizeContext(context)),

  warn: (message: string, context?: LogContext) => {
    tsLogger.warn(message, normalizeContext(context));

    Sentry.captureMessage(message, {
      level: "warning",
      extra: normalizeContext(context),
    });
  },

  error: (message: string, context?: LogContext) => {
    const normalized = normalizeContext(context);
    const error = extractError(context);

    tsLogger.error(message, normalized);

    if (error)
      Sentry.captureException(error, {
        extra: { message, ...normalized },
      });
    else
      Sentry.captureMessage(message, {
        level: "error",
        extra: normalized,
      });
  },

  fatal: (message: string, context?: LogContext) => {
    const normalized = normalizeContext(context);
    const error = extractError(context);

    tsLogger.fatal(message, normalized);

    if (error)
      Sentry.captureException(error, {
        level: "fatal",
        extra: { message, ...normalized },
      });
    else
      Sentry.captureMessage(message, {
        level: "fatal",
        extra: normalized,
      });
  },
};
