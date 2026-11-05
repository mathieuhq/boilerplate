import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { ApiKeyOperationError } from "../errors/api-key-operation.error";
import type { IApiKeyPort } from "../ports/api-key.port";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import { ListUserApiKeysUseCase } from "../use-cases/list-user-api-keys.use-case";

import { createApiKeyRecord, createMockApiKeys } from "./api-key.mock";
import { createAuthSession } from "./session-management.mock";

describe("ListUserApiKeysUseCase", () => {
  let authProvider: IAuthProviderPort;
  let apiKeys: IApiKeyPort;
  let useCase: ListUserApiKeysUseCase;

  beforeEach(() => {
    authProvider = createMockAuthProvider();
    apiKeys = createMockApiKeys();
    useCase = new ListUserApiKeysUseCase(authProvider, apiKeys);
  });

  it("should list the current user's API keys", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(apiKeys.listApiKeys).mockResolvedValue([
      createApiKeyRecord({
        lastRequestAt: new Date("2026-11-02T10:00:00.000Z"),
        expiresAt: new Date("2027-11-01T10:00:00.000Z"),
      }),
    ]);

    const result = await useCase.execute({});

    expect(apiKeys.listApiKeys).toHaveBeenCalledWith("user-1");
    expect(result.value).toEqual({
      apiKeys: [
        {
          id: "key-1",
          name: "CI",
          start: "abc123",
          createdAt: "2026-11-01T10:00:00.000Z",
          lastUsedAt: "2026-11-02T10:00:00.000Z",
          expiresAt: "2027-11-01T10:00:00.000Z",
        },
      ],
      canManage: true,
    });
  });

  it("should not allow management while impersonating", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createAuthSession({ impersonatedBy: "admin-1" }),
    );
    vi.mocked(apiKeys.listApiKeys).mockResolvedValue([]);

    const result = await useCase.execute({});

    expect(result.value).toEqual({ apiKeys: [], canManage: false });
  });

  it("should fail without a session", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(null);

    const result = await useCase.execute({});

    expect((result.error as ApiKeyOperationError).code).toBe(
      "API_KEY_SESSION_REQUIRED",
    );
  });
});
