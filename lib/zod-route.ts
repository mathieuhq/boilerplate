import { headers } from "next/headers";
import { createZodRoute } from "next-zod-route";

import { auth } from "@/lib/auth";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { HttpError } from "@/shared/domain/errors/http.error";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

import { ZodRouteError } from "./errors/zod-route-error";
import { logger } from "./logger";

const route = createZodRoute({
  handleServerError: (e: Error) => {
    if (e instanceof ZodRouteError) {
      logger.debug("[DEV] - ZodRouteError", e);
      return ApiResponse.error(e.code, e.message, e.status, e.details);
    }

    if (e instanceof HttpError) {
      logger.debug("[DEV] - HttpError", e);
      return ApiResponse.error(e.code, e.message, e.status, e.details);
    }

    if (e instanceof ApplicationError) {
      logger.debug("[DEV] - ApplicationError", e);
      return ApiResponse.badRequest("APPLICATION_ERROR", e.message);
    }

    logger.info("Unknown Error", e);

    if (process.env.NODE_ENV === "development")
      return ApiResponse.internalError(e.message);

    return ApiResponse.internalError();
  },
});

const authRoute = route.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw ZodRouteError.unauthorized("Session not found");

  return next({
    ctx: { user: session.user },
  });
});

export const adminRoute = authRoute.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin")
    throw ZodRouteError.forbidden("Admin access required");

  return next({ ctx });
});
