import { createMiddleware, createStart } from "@tanstack/react-start";

import { initGlitchTip } from "@/lib/glitchtip";
import { getIp } from "@/lib/ip";
import { ratelimit } from "@/lib/rate-limit";
import { HttpError } from "@/shared/domain/errors/http.error";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";
import {
  sentryGlobalFunctionMiddleware,
  sentryGlobalRequestMiddleware,
} from "@sentry/tanstackstart-react";

initGlitchTip();

function shouldRateLimitRequest(pathname: string) {
  if (pathname === "/favicon.ico") return false;
  if (pathname.startsWith("/auth")) return false;
  if (pathname.startsWith("/api")) return false;
  if (pathname.includes(".")) return false;

  return true;
}

const rateLimitMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, pathname, request }) => {
    if (!shouldRateLimitRequest(pathname)) return next();

    let rateLimitResult;

    try {
      rateLimitResult = await ratelimit.limit(getIp(request));
    } catch (error) {
      if (error instanceof HttpError)
        return ApiResponse.error(error.code, error.message, error.status);

      throw error;
    }

    const { limit, remaining, success } = rateLimitResult;
    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
    };

    if (!success)
      return ApiResponse.tooManyRequests("Rate limit exceeded", headers);

    const result = await next();

    result.response.headers.set(
      "X-RateLimit-Limit",
      headers["X-RateLimit-Limit"],
    );
    result.response.headers.set(
      "X-RateLimit-Remaining",
      headers["X-RateLimit-Remaining"],
    );

    return result;
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [sentryGlobalRequestMiddleware, rateLimitMiddleware],
  functionMiddleware: [sentryGlobalFunctionMiddleware],
}));
