import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { SessionOperationError } from "../errors/session-operation.error";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import type { ISessionManagementPort } from "../ports/session-management.port";
import { RevokeUserSessionUseCase } from "../use-cases/revoke-user-session.use-case";

import {
  createAuthSession,
  createMockAuditLog,
  createMockSessionManagement,
  createSessionRecord,
} from "./session-management.mock";

describe("RevokeUserSessionUseCase", () => {
  let authProvider: IAuthProviderPort;
  let sessionManagement: ISessionManagementPort;
  let auditLog: IAuditLogPort;
  let useCase: RevokeUserSessionUseCase;

  beforeEach(() => {
    authProvider = createMockAuthProvider();
    sessionManagement = createMockSessionManagement();
    auditLog = createMockAuditLog();
    useCase = new RevokeUserSessionUseCase(
      authProvider,
      sessionManagement,
      auditLog,
    );
  });

  async function expectFailure(code: string, sessionId = "session-phone") {
    const result = await useCase.execute({ sessionId });

    expect(result.isFailure).toBe(true);
    expect((result.error as SessionOperationError).code).toBe(code);
    expect(sessionManagement.revokeSession).not.toHaveBeenCalled();
    expect(auditLog.record).not.toHaveBeenCalled();
  }

  it("should revoke another session and write an audit log", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      createSessionRecord(),
      createSessionRecord({
        id: "session-phone",
        token: "token-phone",
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      }),
    ]);

    const result = await useCase.execute({ sessionId: "session-phone" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ revoked: true });
    expect(sessionManagement.revokeSession).toHaveBeenCalledWith("token-phone");
    expect(auditLog.record).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "user-1",
      action: "auth.session.revoked",
      resourceType: "session",
      resourceId: "session-phone",
      metadata: {
        sessionId: "session-phone",
        browser: "Safari",
        os: "iOS",
        deviceType: "mobile",
      },
    });
  });

  it("should fail without a session", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(null);

    await expectFailure("SESSION_REQUIRED");
  });

  it("should refuse while impersonating", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createAuthSession({ impersonatedBy: "admin-1" }),
    );

    await expectFailure("SESSION_IMPERSONATION_FORBIDDEN");
  });

  it("should refuse to revoke the current session", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());

    await expectFailure("SESSION_IS_CURRENT", "session-current");
  });

  it("should fail when the session does not exist", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      createSessionRecord(),
    ]);

    await expectFailure("SESSION_NOT_FOUND");
  });

  it("should never revoke a session of another user", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      createSessionRecord({ id: "session-phone", userId: "user-2" }),
    ]);

    await expectFailure("SESSION_NOT_FOUND");
  });
});
