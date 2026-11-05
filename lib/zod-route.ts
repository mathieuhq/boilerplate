import { toApiKeyActionError } from "@/features/auth/interface/errors/api-key-action-error.mapper";
import { auth } from "@/lib/auth";
import { getServerRequestHeaders } from "@/lib/request";
import {
  type AccessFeature,
  type AccessLevel,
  hasAccess,
} from "@/shared/domain/access-control";
import { HttpError } from "@/shared/domain/errors/http.error";
import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";
import { classifyError } from "@/shared/infrastructure/http/error-classifier";

type RouteHandlerContext = {
  request: Request;
};

type AuthRouteHandlerContext = RouteHandlerContext & {
  ctx: {
    user: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>["user"];
  };
};

function routeErrorToResponse(error: unknown) {
  const { code, message, status, details } = classifyError(error);

  return ApiResponse.error(code, message, status, details);
}

async function getRequiredRouteUser() {
  const session = await auth.api.getSession({
    headers: getServerRequestHeaders(),
  });

  if (!session?.user) throw HttpError.unauthorized("Session not found");

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
        return routeErrorToResponse(error);
      }
    };
  },
};

export const authRoute = {
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
        throw HttpError.forbidden("Missing access to this feature");

      return handler(context);
    });
  },
});

type PublicRouteHandlerContext = RouteHandlerContext & {
  ctx: Awaited<ReturnType<typeof authenticateApiKey>>;
};

async function authenticateApiKey(request: Request) {
  try {
    return await container
      .getApiKeyController()
      .authenticate(request.headers.get("x-api-key"));
  } catch (error) {
    throw toApiKeyActionError(error);
  }
}

export const publicRoute = {
  handler(
    handler: (
      context: PublicRouteHandlerContext,
    ) => Promise<Response> | Response,
  ) {
    return route.handler(async (context) => {
      const ctx = await authenticateApiKey(context.request);

      return handler({ ...context, ctx });
    });
  },
};
