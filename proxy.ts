import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { getIp } from "@/lib/ip";
import { ratelimit } from "@/lib/rate-limit";
import { SITE_CONFIG } from "@/lib/site-config";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getIp(request);

  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success)
    return ApiResponse.tooManyRequests("Rate limit exceeded", {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
    });

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: SITE_CONFIG.APP_ID,
  });

  if (!sessionCookie) {
    const signinUrl = new URL("/auth/signin", request.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  const response = NextResponse.next();

  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());

  return response;
}

export const config = {
  matcher: [
    "/((?!auth|api|unauthorized|forbidden|error|not-found|_next|favicon.ico|.*\\..*$).*)",
  ],
};
