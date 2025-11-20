import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import { SITE_CONFIG } from "@/lib/site-config";

/**
 * Next.js 16 Proxy (formerly Middleware)
 *
 * Performs optimistic authentication check before request completion.
 * This provides fast UX redirects but is NOT a security layer.
 *
 * SECURITY NOTE:
 * - This only checks for session cookie existence (can be bypassed with fake cookies)
 * - Actual security validation happens in server components via authService.getRequiredUser()
 * - This proxy provides better UX while server-side validation provides real security
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: SITE_CONFIG.APP_ID,
  });

  if (!sessionCookie) {
    const signinUrl = new URL("/auth/signin", request.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.next();
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
