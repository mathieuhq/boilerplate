import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";

import { env } from "@/lib/env";
import { getClientIp } from "@/lib/ip";
import { ratelimit } from "@/lib/rate-limit";
import { getServerUrl } from "@/lib/server-url";
import { HttpError } from "@/shared/domain/errors/http.error";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";
import { getClientRateLimitKey } from "@/shared/infrastructure/http/client-ip";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";
import {
  createCspNonce,
  getSecurityHeaders,
  isRequestBodyTooLarge,
} from "@/shared/infrastructure/http/security-headers";
import { shouldRateLimitRequest } from "@/shared/infrastructure/rate-limit/rate-limit-scope";

const securityHeadersMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const nonce = createCspNonce();
    const result = await next({ context: { nonce } });

    if (import.meta.env.DEV) return result;

    for (const [header, value] of Object.entries(
      getSecurityHeaders(nonce, env.NODE_ENV === "production"),
    )) {
      result.response.headers.set(header, value);
    }

    return result;
  },
);

const bodySizeLimitMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, request }) => {
    if (isRequestBodyTooLarge(request))
      return ApiResponse.error(
        "PAYLOAD_TOO_LARGE",
        "Request body is too large",
        HttpStatus.PAYLOAD_TOO_LARGE,
      );

    return next();
  },
);

const rateLimitMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, pathname, request, handlerType }) => {
    if (!shouldRateLimitRequest(pathname, request.method, handlerType))
      return next();

    let rateLimitResult;

    try {
      rateLimitResult = await ratelimit.limit(
        getClientRateLimitKey(getClientIp(request)),
      );
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

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
  origin: new URL(getServerUrl()).origin,
});

export const startInstance = createStart(() => ({
  requestMiddleware: [
    securityHeadersMiddleware,
    bodySizeLimitMiddleware,
    rateLimitMiddleware,
    csrfMiddleware,
  ],
}));
