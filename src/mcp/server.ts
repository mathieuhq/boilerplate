import { logger } from "@/lib/logger";
import { SITE_CONFIG } from "@/lib/site-config";
import {
  type AuthInfo,
  createMcpHandler,
  type McpRequestContext,
  McpServer,
} from "@modelcontextprotocol/server";

import { type McpTool, type McpUser, registerMcpTools } from "./tool";
import { adminTools } from "./tools/admin.tools";
import { organizationTools } from "./tools/organization.tools";
import { userTools } from "./tools/user.tools";

export const mcpTools: McpTool[] = [
  ...userTools,
  ...organizationTools,
  ...adminTools,
];

export function toMcpAuthInfo(authInfo: AuthInfo, user: McpUser): AuthInfo {
  return { ...authInfo, extra: { ...authInfo.extra, user } };
}

function getMcpUser(authInfo?: AuthInfo) {
  const user = authInfo?.extra?.user as McpUser | undefined;

  if (!user) throw new Error("MCP request is missing its authenticated user");

  return user;
}

function createMcpServer({ authInfo }: Pick<McpRequestContext, "authInfo">) {
  const user = getMcpUser(authInfo);
  const server = new McpServer(
    { name: SITE_CONFIG.APP_ID, version: "1.0.0" },
    {
      instructions: `Tools act on behalf of ${user.email} in ${SITE_CONFIG.TITLE}. Organization tools take an explicit organizationId: call list_organizations first.`,
    },
  );

  registerMcpTools(server, mcpTools, { user });

  return server;
}

export const mcpHandler = createMcpHandler(createMcpServer, {
  onerror: (error) => logger.warn("MCP request failed", { error }),
});
