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

function shouldRateLimitRequest(pathname: string) {
  if (pathname === "/favicon.ico") return false;
  if (pathname === "/globe.svg") return false;
  if (pathname === "/api/health") return false;
  if (pathname.startsWith("/assets/")) return false;

  return true;
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const productionSecurityHeaders = {
  "Content-Security-Policy": contentSecurityPolicy,
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

const securityHeadersMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    const result = await next();

    if (env.NODE_ENV !== "production") return result;

    for (const [header, value] of Object.entries(productionSecurityHeaders)) {
      result.response.headers.set(header, value);
    }

    return result;
  },
);

const rateLimitMiddleware = createMiddleware({ type: "request" }).server(
  async ({ next, pathname, request }) => {
    if (!shouldRateLimitRequest(pathname)) return next();

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
    rateLimitMiddleware,
    csrfMiddleware,
  ],
}));
