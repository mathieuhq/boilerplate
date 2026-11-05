import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/lib/auth";
import { type McpPrincipal, runWithMcpPrincipal } from "@/lib/mcp/principal";
import { getMcpResourceUrl } from "@/lib/mcp/resource";
import { mcpHandler, toMcpAuthInfo } from "@/mcp/server";
import { container } from "@/shared/infrastructure/di/container";
import { requireMcpAuth } from "@better-auth/mcp";

type AccessTokenClaims = Parameters<Parameters<typeof requireMcpAuth>[1]>[1];

function toMcpPrincipal(claims: AccessTokenClaims): McpPrincipal | null {
  const clientId = typeof claims.azp === "string" ? claims.azp : undefined;

  if (!claims.sub || !clientId || !claims.jti || !claims.exp) return null;

  if (claims.sub === clientId) return null;

  return {
    clientId,
    userId: claims.sub,
    tokenId: claims.jti,
    expiresAt: new Date(claims.exp * 1000),
    scopes: typeof claims.scope === "string" ? claims.scope.split(" ") : [],
  };
}

function forbidden(message: string) {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32000, message }, id: null },
    { status: 403 },
  );
}

const resource = getMcpResourceUrl();

const handleMcpRequest = requireMcpAuth(
  auth,
  async (request, claims) => {
    const principal = toMcpPrincipal(claims);

    if (!principal) return forbidden("A user access token is required");

    return runWithMcpPrincipal(principal, async () => {
      const session = await container
        .getAuthController()
        .getSession()
        .catch(() => null);

      if (!session) return forbidden("This user cannot access the MCP server");

      const access = await container
        .getAdminController()
        .resolveAccess(session.user.role);

      const token = request.headers.get("authorization")?.split(" ")[1] ?? "";

      return mcpHandler.fetch(request, {
        authInfo: toMcpAuthInfo(
          {
            token,
            expiresAt: claims.exp,
            scopes: principal.scopes,
            resource: new URL(resource),
            clientId: principal.clientId,
          },
          { ...session.user, access },
        ),
      });
    });
  },
  { resource },
);

export const Route = createFileRoute("/api/v1/public/mcp")({
  server: {
    handlers: {
      POST: async ({ request }) => handleMcpRequest(request),
    },
  },
});
