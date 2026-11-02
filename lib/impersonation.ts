import type { BetterAuthPlugin } from "better-auth";
import {
  APIError,
  createAuthEndpoint,
  sessionMiddleware,
} from "better-auth/api";
import { deleteSessionCookie, setSessionCookie } from "better-auth/cookies";
import { z } from "zod";

const startImpersonationBodySchema = z.object({
  userId: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const impersonation = () =>
  ({
    id: "impersonation",
    endpoints: {
      startImpersonation: createAuthEndpoint(
        "/impersonation/start",
        {
          method: "POST",
          body: startImpersonationBodySchema,
          use: [sessionMiddleware],
          metadata: { SERVER_ONLY: true },
        },
        async (ctx) => {
          const actor = ctx.context.session;
          const actorSession = actor.session as { impersonatedBy?: unknown };

          if (actorSession.impersonatedBy)
            throw APIError.fromStatus("FORBIDDEN", {
              message: "You are already impersonating a user",
            });

          const targetUser = await ctx.context.internalAdapter.findUserById(
            ctx.body.userId,
          );

          if (!targetUser)
            throw APIError.fromStatus("NOT_FOUND", {
              message: "User not found",
            });

          const session = await ctx.context.internalAdapter.createSession(
            targetUser.id,
            true,
            {
              impersonatedBy: actor.user.id,
              expiresAt: new Date(Date.now() + ctx.body.expiresIn * 1000),
            },
            true,
          );

          const authCookies = ctx.context.authCookies;
          const dontRememberCookie = await ctx.getSignedCookie(
            authCookies.dontRememberToken.name,
            ctx.context.secret,
          );
          const adminCookie = ctx.context.createAuthCookie("admin_session");

          deleteSessionCookie(ctx);

          await ctx.setSignedCookie(
            adminCookie.name,
            `${actor.session.token}:${dontRememberCookie ?? ""}`,
            ctx.context.secret,
            authCookies.sessionToken.attributes,
          );
          await setSessionCookie(ctx, { session, user: targetUser }, true);

          return ctx.json({ expiresAt: session.expiresAt });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
