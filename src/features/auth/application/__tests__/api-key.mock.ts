import { vi } from "vitest";

import type { ApiKeyRecord, IApiKeyPort } from "../ports/api-key.port";

export function createMockApiKeys(): IApiKeyPort {
  return {
    verifyApiKey: vi.fn(),
    listApiKeys: vi.fn(),
    createApiKey: vi.fn(),
    deleteApiKey: vi.fn(),
  };
}

export function createApiKeyRecord(
  overrides: Partial<ApiKeyRecord> = {},
): ApiKeyRecord {
  return {
    id: "key-1",
    name: "CI",
    start: "abc123",
    userId: "user-1",
    createdAt: new Date("2026-11-01T10:00:00.000Z"),
    lastRequestAt: null,
    expiresAt: null,
    ...overrides,
  };
}
