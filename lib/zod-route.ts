import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createZodRoute } from "next-zod-route";

import { auth } from "@/lib/auth";
import { ApplicationError } from "@/shared/domain/errors/application.error";

import { ZodRouteError } from "./errors/zod-route-error";
import { logger } from "./logger";

/**
 * Base API route handler with Zod validation and error handling
 */
export const route = createZodRoute({
  handleServerError: (e: Error) => {
    if (e instanceof ZodRouteError) {
      logger.debug("[DEV] - ZodRouteError", e);

      return NextResponse.json(
        { message: e.message },
        {
          status: e.status,
        },
      );
    }

    if (e instanceof ApplicationError) {
      logger.debug("[DEV] - ApplicationError", e);

      return NextResponse.json({ message: e.message }, { status: 400 });
    }

    logger.info("Unknown Error", e);

    if (process.env.NODE_ENV === "development")
      return NextResponse.json({ message: e.message }, { status: 500 });

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  },
});

/**
 * Authenticated API route handler with user context
 */
export const authRoute = route.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) throw new ZodRouteError("Session not found!", 401);

  return next({
    ctx: { user: session.user },
  });
});

/**
 * Admin API route handler with admin role verification
 */
export const adminRoute = authRoute.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new ZodRouteError("Forbidden", 403);

  return next({ ctx });
});
