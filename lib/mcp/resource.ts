import { getServerUrl } from "@/lib/server-url";

const MCP_ENDPOINT_PATH = "/api/v1/public/mcp";

export function getMcpResourceUrl() {
  return `${getServerUrl().replace(/\/$/, "")}${MCP_ENDPOINT_PATH}`;
}
