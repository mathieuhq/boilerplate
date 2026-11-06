import { getServerUrl } from "@/lib/server-url";
import { SITE_CONFIG } from "@/lib/site-config";

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
});

export function getOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: `${SITE_CONFIG.TITLE} API`,
      version: "1",
      description:
        "Public API. Create an API key in Settings → API keys and send it in the `x-api-key` header. Requests are limited to 100 per minute per IP and per key.",
    },
    servers: [{ url: `${getServerUrl()}/api/v1/public` }],
    components: {
      securitySchemes: {
        apiKey: { type: "apiKey", in: "header", name: "x-api-key" },
        mcpOAuth: {
          type: "http",
          scheme: "bearer",
          description:
            "OAuth access token obtained by an MCP client through the authorization server advertised in `/.well-known/oauth-protected-resource`.",
        },
      },
      schemas: {
        Error: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: { type: "string", examples: ["UNAUTHORIZED"] },
                message: { type: "string" },
                details: {},
              },
            },
          },
        },
      },
    },
    paths: {
      "/health": {
        get: {
          operationId: "getHealth",
          summary: "Check the API and its dependencies",
          security: [],
          responses: {
            "200": {
              description: "Every dependency is reachable",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          status: { type: "string", const: "ok" },
                          checks: {
                            type: "object",
                            properties: {
                              database: { type: "string", enum: ["ok"] },
                              redis: { type: "string", enum: ["ok"] },
                            },
                          },
                          timestamp: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
            "503": errorResponse("A dependency is unavailable"),
          },
        },
      },
      "/me": {
        get: {
          operationId: "getMe",
          summary: "Get the API key and the user that owns it",
          security: [{ apiKey: [] }],
          responses: {
            "200": {
              description: "The authenticated API key",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          keyId: { type: "string" },
                          user: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string", format: "email" },
                              role: { type: ["string", "null"] },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            "401": errorResponse("Missing or invalid API key"),
            "429": errorResponse("Too many requests"),
          },
        },
      },
      "/mcp": {
        post: {
          operationId: "callMcp",
          summary: "MCP server (Streamable HTTP, JSON-RPC 2.0)",
          description:
            "Connect an MCP client to this URL rather than calling it by hand. See the MCP page in the app for setup instructions.",
          security: [{ mcpOAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["jsonrpc", "method"],
                  properties: {
                    jsonrpc: { type: "string", const: "2.0" },
                    id: { type: ["string", "number"] },
                    method: { type: "string", examples: ["tools/list"] },
                    params: { type: "object" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "JSON-RPC response or event stream" },
            "401": errorResponse("Missing or invalid access token"),
            "429": errorResponse("Too many requests"),
          },
        },
      },
    },
  };
}
