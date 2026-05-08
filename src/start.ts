import { createMiddleware, createStart } from "@tanstack/react-start";

import { env } from "@/lib/env";
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
  if (pathname === "/globe.svg") return false;
  if (pathname === "/api/health") return false;
  if (pathname.startsWith("/assets/")) return false;

  return true;
}

function getUrlOrigin(value?: string) {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function buildContentSecurityPolicy() {
  const scriptSrc = new Set(["'self'", "'unsafe-inline'"]);
  const connectSrc = new Set(["'self'"]);
  const umamiOrigin = getUrlOrigin(env.VITE_UMAMI_URL);
  const glitchTipOrigin = getUrlOrigin(env.VITE_GLITCHTIP_DSN);

  if (umamiOrigin) {
    scriptSrc.add(umamiOrigin);
    connectSrc.add(umamiOrigin);
  }

  if (glitchTipOrigin) connectSrc.add(glitchTipOrigin);

  return [
    "default-src 'self'",
    `script-src ${Array.from(scriptSrc).join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(connectSrc).join(" ")}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const productionSecurityHeaders = {
  "Content-Security-Policy": buildContentSecurityPolicy(),
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
  requestMiddleware: [
    sentryGlobalRequestMiddleware,
    securityHeadersMiddleware,
    rateLimitMiddleware,
  ],
  functionMiddleware: [sentryGlobalFunctionMiddleware],
}));
