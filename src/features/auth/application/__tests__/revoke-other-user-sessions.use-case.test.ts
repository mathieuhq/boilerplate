import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { SessionOperationError } from "../errors/session-operation.error";
import type { IAuthProviderPort } from "../ports/auth-provider.port";
import type { ISessionManagementPort } from "../ports/session-management.port";
import { RevokeOtherUserSessionsUseCase } from "../use-cases/revoke-other-user-sessions.use-case";

import {
  createAuthSession,
  createMockAuditLog,
  createMockSessionManagement,
  createSessionRecord,
} from "./session-management.mock";

describe("RevokeOtherUserSessionsUseCase", () => {
  let authProvider: IAuthProviderPort;
  let sessionManagement: ISessionManagementPort;
  let auditLog: IAuditLogPort;
  let useCase: RevokeOtherUserSessionsUseCase;

  beforeEach(() => {
    authProvider = createMockAuthProvider();
    sessionManagement = createMockSessionManagement();
    auditLog = createMockAuditLog();
    useCase = new RevokeOtherUserSessionsUseCase(
      authProvider,
      sessionManagement,
      auditLog,
    );
  });

  it("should revoke every other active session and log how many", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(createAuthSession());
    vi.mocked(sessionManagement.listSessions).mockResolvedValue([
      createSessionRecord(),
      createSessionRecord({ id: "session-phone", userAgent: null }),
      createSessionRecord({
        id: "session-expired",
        expiresAt: new Date("2020-01-01"),
      }),
    ]);

    const result = await useCase.execute({});

    expect(result.value).toEqual({ revokedCount: 1 });
    expect(sessionManagement.revokeOtherSessions).toHaveBeenCalledOnce();
    expect(auditLog.record).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "user-1",
      action: "auth.session.revoked-others",
      resourceType: "session",
      resourceId: "session-current",
      metadata: {
        revokedCount: 1,
        sessions: [
          {
            sessionId: "session-phone",
            browser: null,
            os: null,
            deviceType: "desktop",
          },
        ],
      },
    });
  });

  it("should fail without a session", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(null);

    const result = await useCase.execute({});

    expect((result.error as SessionOperationError).code).toBe(
      "SESSION_REQUIRED",
    );
    expect(sessionManagement.revokeOtherSessions).not.toHaveBeenCalled();
  });

  it("should refuse while impersonating", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createAuthSession({ impersonatedBy: "admin-1" }),
    );

    const result = await useCase.execute({});

    expect((result.error as SessionOperationError).code).toBe(
      "SESSION_IMPERSONATION_FORBIDDEN",
    );
    expect(sessionManagement.revokeOtherSessions).not.toHaveBeenCalled();
    expect(auditLog.record).not.toHaveBeenCalled();
  });
});
