import { getServerUrl } from "@/lib/server-url";

const MCP_ENDPOINT_PATH = "/api/mcp";

export function getMcpResourceUrl() {
  return `${getServerUrl().replace(/\/$/, "")}${MCP_ENDPOINT_PATH}`;
}
