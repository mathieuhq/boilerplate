import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import type { IImpersonationPort } from "@/features/auth/application/ports/impersonation.port";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminOperationError } from "../errors/admin-operation.error";
import { StopImpersonationUseCase } from "../use-cases/stop-impersonation.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

function createSession(impersonatedBy: string | null | undefined) {
  return {
    user: { id: "user-1", name: "Ada", email: "ada@example.com" },
    session: {
      id: "session-impersonation",
      userId: "user-1",
      expiresAt: new Date("2099-01-01"),
      activeOrganizationId: null,
      impersonatedBy,
    },
  };
}

describe("StopImpersonationUseCase", () => {
  let adminRepository: IAdminRepository;
  let authProvider: IAuthProviderPort;
  let impersonation: IImpersonationPort;
  let useCase: StopImpersonationUseCase;

  beforeEach(() => {
    adminRepository = createMockAdminRepository();
    authProvider = createMockAuthProvider();
    impersonation = {
      startImpersonation: vi.fn(),
      stopImpersonation: vi.fn(),
    };
    useCase = new StopImpersonationUseCase(
      adminRepository,
      authProvider,
      impersonation,
    );
  });

  it("should stop the impersonation and log it for the admin", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(
      createSession("support-1"),
    );

    const result = await useCase.execute({});

    expect(result.value).toEqual({ impersonatedUserId: "user-1" });
    expect(impersonation.stopImpersonation).toHaveBeenCalledOnce();
    expect(adminRepository.createAuditLog).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "support-1",
      action: "admin.impersonation.stopped",
      resourceType: "user",
      resourceId: "user-1",
      metadata: { sessionId: "session-impersonation" },
    });
  });

  it.each([
    ["without a session", null],
    ["outside an impersonation", createSession(null)],
    ["without an impersonation field", createSession(undefined)],
  ])("should fail %s", async (_label, session) => {
    vi.mocked(authProvider.getSession).mockResolvedValue(session);

    const result = await useCase.execute({});

    expect((result.error as AdminOperationError).code).toBe(
      "ADMIN_NOT_IMPERSONATING",
    );
    expect(impersonation.stopImpersonation).not.toHaveBeenCalled();
    expect(adminRepository.createAuditLog).not.toHaveBeenCalled();
  });
});
