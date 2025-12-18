import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { ratelimit } from "@/lib/rate-limit";
import { SITE_CONFIG } from "@/lib/site-config";

/**
 * Next.js 16 Proxy (formerly Middleware)
 *
 * Performs rate limiting and optimistic authentication check before request completion.
 * Rate limiting is a security layer, authentication check provides fast UX redirects.
 *
 * SECURITY NOTE:
 * - Rate limiting blocks abusive traffic at the edge
 * - Authentication check only verifies session cookie existence (can be bypassed with fake cookies)
 * - Actual auth validation happens in server components via authService.getRequiredUser()
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

  const { success, limit, remaining } = await ratelimit.limit(ip);

  if (!success)
    return NextResponse.json(
      { error: { code: "TOO_MANY_REQUESTS", message: "Rate limit exceeded" } },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
        },
      },
    );

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
    /*
     * Match all request paths EXCEPT:
     * - /auth/* (signin, signup, forgot-password)
     * - /api/auth/* (Better Auth API endpoints)
     * - /unauthorized, /forbidden, /error, /not-found (error pages)
     * - /_next/* (Next.js internal routes)
     * - /favicon.ico, /robots.txt, etc. (static files with extensions)
     */
    "/((?!auth|api/auth|unauthorized|forbidden|error|not-found|_next|favicon.ico|.*\\..*$).*)",
  ],
};
