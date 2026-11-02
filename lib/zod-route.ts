import { auth } from "@/lib/auth";
import { ZodRouteError } from "@/lib/errors/zod-route-error";
import { logger } from "@/lib/logger";
import { getServerRequestHeaders } from "@/lib/request";
import {
  type AccessFeature,
  type AccessLevel,
  hasAccess,
} from "@/shared/domain/access-control";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { HttpError } from "@/shared/domain/errors/http.error";
import { container } from "@/shared/infrastructure/di/container";
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

  if (e instanceof DomainError) {
    logger.debug("[DEV] - DomainError", e);
    return ApiResponse.validationError(e.message);
  }

  if (e instanceof ApplicationError) {
    logger.debug("[DEV] - ApplicationError", e);

    if (process.env.NODE_ENV === "production")
      return ApiResponse.badRequest("APPLICATION_ERROR", "Request failed");

    return ApiResponse.badRequest("APPLICATION_ERROR", e.message);
  }

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

export const accessRoute = (feature: AccessFeature, level: AccessLevel) => ({
  handler(
    handler: (context: AuthRouteHandlerContext) => Promise<Response> | Response,
  ) {
    return authRoute.handler(async (context) => {
      const access = await container
        .getAdminController()
        .resolveAccess(context.ctx.user.role);

      if (!hasAccess(access, feature, level))
        throw ZodRouteError.forbidden("Missing access to this feature");

      return handler(context);
    });
  },
});
