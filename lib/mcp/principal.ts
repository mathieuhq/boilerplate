import { AsyncLocalStorage } from "node:async_hooks";

export type McpPrincipal = {
  userId: string;
  clientId: string;
  scopes: string[];
  tokenId: string;
  expiresAt: Date;
};

const mcpPrincipalStorage = new AsyncLocalStorage<McpPrincipal>();

export function runWithMcpPrincipal<T>(
  principal: McpPrincipal,
  callback: () => T,
) {
  return mcpPrincipalStorage.run(principal, callback);
}

export function getMcpPrincipal() {
  return mcpPrincipalStorage.getStore();
}
