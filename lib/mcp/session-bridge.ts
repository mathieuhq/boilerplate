import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";

import { getMcpPrincipal } from "./principal";

type BannableUser = {
  banned?: boolean | null;
  banExpires?: Date | null;
};

function isBanned(user: BannableUser, now: Date) {
  if (!user.banned) return false;

  return !user.banExpires || user.banExpires > now;
}

export const mcpSessionBridge = () =>
  ({
    id: "mcp-session-bridge",
    hooks: {
      before: [
        {
          matcher: () => getMcpPrincipal() !== undefined,
          handler: createAuthMiddleware(async (ctx) => {
            const principal = getMcpPrincipal();

            if (!principal) return;

            const user = await ctx.context.internalAdapter.findUserById(
              principal.userId,
            );
            const now = new Date();

            if (!user || isBanned(user as BannableUser, now))
              throw new APIError("UNAUTHORIZED", {
                message: "MCP access token user is not allowed",
              });

            const session = {
              user,
              session: {
                id: `mcp_${principal.tokenId}`,
                token: `mcp_${principal.tokenId}`,
                userId: user.id,
                ipAddress: null,
                userAgent: null,
                createdAt: now,
                updatedAt: now,
                expiresAt: principal.expiresAt,
                activeOrganizationId: null,
              },
            };

            ctx.context.session = session;

            if (ctx.path === "/get-session") return session;

            return { context: ctx };
          }),
        },
      ],
    },
  }) satisfies BetterAuthPlugin;
