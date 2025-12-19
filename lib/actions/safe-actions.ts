import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "@/lib/auth";
import { ActionError } from "@/lib/errors/action-error";
import { logger } from "@/lib/logger";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { HttpError } from "@/shared/domain/errors/http.error";

export const authAction = createSafeActionClient({
  handleServerError,
}).use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/auth/signin");

  return next({
    ctx: {
      user: session.user,
    },
  });
});

const _adminAction = authAction.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin")
    throw ActionError.forbidden("Admin access required");

  return next({ ctx });
});

function handleServerError(e: Error): string {
  if (e instanceof ActionError) {
    logger.debug("[DEV] - ActionError", e.message);
    return JSON.stringify({
      error: { code: e.code, message: e.message, details: e.details },
    });
  }

  if (e instanceof HttpError) {
    logger.debug("[DEV] - HttpError", e.message);
    return JSON.stringify({
      error: { code: e.code, message: e.message, details: e.details },
    });
  }

  if (e instanceof ApplicationError) {
    logger.debug("[DEV] - ApplicationError", e.message);
    return JSON.stringify({
      error: { code: "APPLICATION_ERROR", message: e.message },
    });
  }

  logger.info("Unknown Error", e);

  if (process.env.NODE_ENV === "development")
    return JSON.stringify({
      error: { code: "INTERNAL_ERROR", message: e.message },
    });

  return JSON.stringify({
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}
