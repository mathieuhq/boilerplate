import { createSafeActionClient } from "next-safe-action";

import { logger } from "@/lib/logger";
import { authService } from "@/services/auth/auth.service";

import { ApplicationError } from "../errors/application-error";

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
  const user = await authService.getRequiredUser();

  return next({
    ctx: {
      user: user,
    },
  });
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
