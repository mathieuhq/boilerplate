import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { ApiKeyOperationError } from "../errors/api-key-operation.error";
import type { IApiKeyPort } from "../ports/api-key.port";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import { CreateUserApiKeyUseCase } from "../use-cases/create-user-api-key.use-case";

import { createApiKeyRecord, createMockApiKeys } from "./api-key.mock";
import {
  createAuthSession,
  createMockAuditLog,
} from "./session-management.mock";

describe("CreateUserApiKeyUseCase", () => {
  let authProvider: IAuthProviderPort;
  let apiKeys: IApiKeyPort;
  let auditLog: IAuditLogPort;
  let useCase: CreateUserApiKeyUseCase;

  beforeEach(() => {
    authProvider = createMockAuthProvider();
    apiKeys = createMockApiKeys();
    auditLog = createMockAuditLog();
    useCase = new CreateUserApiKeyUseCase(authProvider, apiKeys, auditLog);
  });

  async function expectFailure(code: string) {
    const result = await useCase.execute({ name: "CI" });

    expect((result.error as ApiKeyOperationError).code).toBe(code);
    expect(apiKeys.createApiKey).not.toHaveBeenCalled();
    expect(auditLog.record).not.toHaveBeenCalled();
  }

  it("should create a key, return its secret once and write an audit log", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(apiKeys.createApiKey).mockResolvedValue({
      record: createApiKeyRecord(),
      key: "abc123secret",
    });

    const result = await useCase.execute({ name: "CI" });

    expect(apiKeys.createApiKey).toHaveBeenCalledWith("user-1", "CI");
    expect(result.value).toEqual({
      key: "abc123secret",
      apiKey: {
        id: "key-1",
        name: "CI",
        start: "abc123",
        createdAt: "2026-11-01T10:00:00.000Z",
        lastUsedAt: null,
        expiresAt: null,
      },
    });
    expect(auditLog.record).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "user-1",
      action: "auth.api-key.created",
      resourceType: "api_key",
      resourceId: "key-1",
      metadata: { name: "CI", start: "abc123" },
    });
  });

  it("should fail without a session", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(null);

    await expectFailure("API_KEY_SESSION_REQUIRED");
  });

  it("should fail while impersonating", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createAuthSession({ impersonatedBy: "admin-1" }),
    );

    await expectFailure("API_KEY_IMPERSONATION_FORBIDDEN");
  });
});
