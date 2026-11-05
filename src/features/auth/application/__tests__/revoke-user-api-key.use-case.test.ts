import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { ApiKeyOperationError } from "../errors/api-key-operation.error";
import type { IApiKeyPort } from "../ports/api-key.port";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import { RevokeUserApiKeyUseCase } from "../use-cases/revoke-user-api-key.use-case";

import { createMockApiKeys } from "./api-key.mock";
import {
  createAuthSession,
  createMockAuditLog,
} from "./session-management.mock";

describe("RevokeUserApiKeyUseCase", () => {
  let authProvider: IAuthProviderPort;
  let apiKeys: IApiKeyPort;
  let auditLog: IAuditLogPort;
  let useCase: RevokeUserApiKeyUseCase;

  beforeEach(() => {
    authProvider = createMockAuthProvider();
    apiKeys = createMockApiKeys();
    auditLog = createMockAuditLog();
    useCase = new RevokeUserApiKeyUseCase(authProvider, apiKeys, auditLog);
  });

  async function expectFailure(code: string) {
    const result = await useCase.execute({ keyId: "key-1" });

    expect((result.error as ApiKeyOperationError).code).toBe(code);
    expect(auditLog.record).not.toHaveBeenCalled();
  }

  it("should revoke the user's key and write an audit log", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(apiKeys.deleteApiKey).mockResolvedValue(true);

    const result = await useCase.execute({ keyId: "key-1" });

    expect(apiKeys.deleteApiKey).toHaveBeenCalledWith("user-1", "key-1");
    expect(result.value).toEqual({ revoked: true });
    expect(auditLog.record).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "user-1",
      action: "auth.api-key.revoked",
      resourceType: "api_key",
      resourceId: "key-1",
    });
  });

  it("should fail when the key does not belong to the user", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(apiKeys.deleteApiKey).mockResolvedValue(false);

    await expectFailure("API_KEY_NOT_FOUND");
  });

  it("should fail without a session", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(null);

    await expectFailure("API_KEY_SESSION_REQUIRED");
    expect(apiKeys.deleteApiKey).not.toHaveBeenCalled();
  });

  it("should fail while impersonating", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createAuthSession({ impersonatedBy: "admin-1" }),
    );

    await expectFailure("API_KEY_IMPERSONATION_FORBIDDEN");
    expect(apiKeys.deleteApiKey).not.toHaveBeenCalled();
  });
});
