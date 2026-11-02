import type { z } from "zod";

import { actionErrorResponse } from "@/server-functions/action-errors.server";
import type {
  CallToolResult,
  McpServer,
  ToolAnnotations,
} from "@modelcontextprotocol/server";

export type McpUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
};

export type McpToolContext = {
  user: McpUser;
};

export type McpTool<Schema extends z.ZodObject = z.ZodObject> = {
  name: string;
  title: string;
  description: string;
  inputSchema: Schema;
  annotations?: ToolAnnotations;
  adminOnly?: boolean;
  mapError?: (error: unknown) => unknown;
  handler: (
    input: z.output<Schema>,
    context: McpToolContext,
  ) => Promise<unknown>;
};

export function defineMcpTool<Schema extends z.ZodObject>(
  tool: McpTool<Schema>,
) {
  return tool as unknown as McpTool;
}

export function toMcpToolResult(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data ?? null, null, 2) }],
  };
}

export function toMcpToolError(error: unknown): CallToolResult {
  const response = actionErrorResponse(error);

  return {
    isError: true,
    content: [{ type: "text", text: JSON.stringify(response.error, null, 2) }],
  };
}

export function getAvailableMcpTools(tools: McpTool[], user: McpUser) {
  return tools.filter((tool) => !tool.adminOnly || user.role === "admin");
}

export function registerMcpTools(
  server: McpServer,
  tools: McpTool[],
  context: McpToolContext,
) {
  for (const tool of getAvailableMcpTools(tools, context.user)) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: tool.annotations,
      },
      async (input) => {
        try {
          const data = await tool.handler(input, context);

          return toMcpToolResult(data);
        } catch (error) {
          return toMcpToolError(tool.mapError ? tool.mapError(error) : error);
        }
      },
    );
  }
}
