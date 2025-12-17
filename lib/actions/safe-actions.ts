import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSafeActionClient } from "next-safe-action";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { ApplicationError } from "@/shared/domain/errors/application.error";

/**
 * Base safe action client for public server actions
 */
export const action = createSafeActionClient({
  handleServerError,
});

/**
 * Authenticated safe action client with user context
 */
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

/**
 * Admin safe action client with admin role verification
 */
export const adminAction = authAction.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new ApplicationError("Forbidden");
  }

  return next({ ctx });
});

/**
 * Handles server action errors with proper logging
 */
function handleServerError(e: Error) {
  if (e instanceof ApplicationError) {
    logger.debug("[DEV] - Action Error", e.message);
    return e.message;
  }

  logger.info("Unknown Error", e);

  if (process.env.NODE_ENV === "development") return e.message;

  return "An unexpected error occurred.";
}
