import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import {
  getLocaleFromPathname,
  getLocaleFromRequest,
  getLocalizedPath,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  pathnameHasLocale,
  routing,
} from "@/lib/i18n";
import { getIp } from "@/lib/ip";
import { ratelimit } from "@/lib/rate-limit";
import { SITE_CONFIG } from "@/lib/site-config";
import { ApiResponse } from "@/shared/infrastructure/http";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIp(request);

  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success)
    return ApiResponse.tooManyRequests("Rate limit exceeded", {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
    });

  const hasLocalePrefix = pathnameHasLocale(pathname);
  const pathnameLocale = getLocaleFromPathname(pathname);
  const detectedLocale = pathnameLocale ?? getLocaleFromRequest(request);

  if (!hasLocalePrefix && detectedLocale !== routing.defaultLocale) {
    const newUrl = new URL(`/${detectedLocale}${pathname}`, request.url);

    newUrl.search = request.nextUrl.search;

    const response = NextResponse.redirect(newUrl);

    response.cookies.set(LOCALE_COOKIE_NAME, detectedLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: LOCALE_COOKIE_MAX_AGE,
    });

    return response;
  }

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: SITE_CONFIG.APP_ID,
  });

  if (!sessionCookie) {
    const signinPath = getLocalizedPath("/auth/signin", detectedLocale);
    const signinUrl = new URL(signinPath, request.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  const response = NextResponse.next();

  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-Locale", detectedLocale);

  if (pathnameLocale) {
    response.cookies.set(LOCALE_COOKIE_NAME, pathnameLocale, {
      path: "/",
      sameSite: "lax",
      maxAge: LOCALE_COOKIE_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!auth|api/auth|unauthorized|forbidden|error|not-found|_next|favicon.ico|.*\\..*$).*)",
  ],
};
