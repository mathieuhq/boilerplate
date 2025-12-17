import { Logger } from "tslog";

import { SITE_CONFIG } from "@/lib/site-config";
import * as Sentry from "@sentry/nextjs";

const tsLogger = new Logger({
  name: SITE_CONFIG.TITLE,
  minLevel: process.env.NODE_ENV === "production" ? 3 : 0,
});

export const logger = {
  debug: (message: string, ...args: unknown[]) =>
    tsLogger.debug(message, ...args),

  info: (message: string, ...args: unknown[]) =>
    tsLogger.info(message, ...args),

  warn: (message: string, ...args: unknown[]) => {
    tsLogger.warn(message, ...args);

    Sentry.captureMessage(message, {
      level: "warning",
      extra: { args },
    });
  },

  error: (message: string, error?: Error, ...args: unknown[]) => {
    tsLogger.error(message, error, ...args);

    if (error)
      Sentry.captureException(error, {
        extra: { message, args },
      });
    else
      Sentry.captureMessage(message, {
        level: "error",
        extra: { args },
      });
  },

  fatal: (message: string, error?: Error, ...args: unknown[]) => {
    tsLogger.fatal(message, error, ...args);

    if (error)
      Sentry.captureException(error, {
        level: "fatal",
        extra: { message, args },
      });
    else
      Sentry.captureMessage(message, {
        level: "fatal",
        extra: { args },
      });
  },
};
