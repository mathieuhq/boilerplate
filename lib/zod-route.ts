import { auth } from "@/lib/auth";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { captureUnexpectedError } from "@/lib/glitchtip";
import { logger } from "@/lib/logger";
import { getServerRequestHeaders } from "@/lib/request";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { HttpError } from "@/shared/domain/errors/http.error";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

type RouteHandlerContext = {
  request: Request;
};

type AuthRouteHandlerContext = RouteHandlerContext & {
  ctx: {
    user: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"];
  };
};

function routeErrorToResponse(e: Error) {
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

  captureUnexpectedError(e);
  logger.info("Unknown Error", e);

  if (process.env.NODE_ENV === "development")
    return ApiResponse.internalError(e.message);

  return ApiResponse.internalError();
}

async function getRequiredRouteUser() {
  const session = await auth.api.getSession({
    headers: getServerRequestHeaders(),
  });

  if (!session?.user) throw ZodRouteError.unauthorized("Session not found");

  return session.user;
}

const route = {
  handler(
    handler: (context: RouteHandlerContext) => Promise<Response> | Response,
  ) {
    return async (context: RouteHandlerContext) => {
      try {
        return await handler(context);
      } catch (error) {
        return routeErrorToResponse(error as Error);
      }
    };
  },
};

const authRoute = {
  handler(
    handler: (context: AuthRouteHandlerContext) => Promise<Response> | Response,
  ) {
    return route.handler(async (context) => {
      const user = await getRequiredRouteUser();

      return handler({ ...context, ctx: { user } });
    });
  },
};

export const adminRoute = {
  handler(
    handler: (context: AuthRouteHandlerContext) => Promise<Response> | Response,
  ) {
    return authRoute.handler(async (context) => {
      if (context.ctx.user.role !== "admin")
        throw ZodRouteError.forbidden("Admin access required");

      return handler(context);
    });
  },
};
