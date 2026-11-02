import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import type { IImpersonationPort } from "@/features/auth/application/ports/impersonation.port";
import { getFullAccess } from "@/shared/domain/access-control";
import { createMockAuthProvider } from "@/test/utils/mock-factories";

import { IMPERSONATION_SESSION_DURATION_SECONDS } from "../../domain/impersonation";
import type { IAdminRoleRepository } from "../../domain/repositories/admin-role.repository.interface";
import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminOperationError } from "../errors/admin-operation.error";
import { ImpersonateAdminUserUseCase } from "../use-cases/impersonate-admin-user.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";
import {
  createCustomRole,
  createMockAdminRoleRepository,
} from "./admin-role-repository.mock";

const SUPPORT_ACCESS = {
  users: "read",
  impersonation: "write",
} as const;

const EXPIRES_AT = new Date("2026-11-02T12:30:00.000Z");

describe("ImpersonateAdminUserUseCase", () => {
  let adminRepository: IAdminRepository;
  let roleRepository: IAdminRoleRepository;
  let authProvider: IAuthProviderPort;
  let impersonation: IImpersonationPort;
  let useCase: ImpersonateAdminUserUseCase;

  beforeEach(() => {
    adminRepository = createMockAdminRepository();
    roleRepository = createMockAdminRoleRepository();
    authProvider = createMockAuthProvider();
    impersonation = {
      startImpersonation: vi.fn().mockResolvedValue({ expiresAt: EXPIRES_AT }),
      stopImpersonation: vi.fn(),
    };
    useCase = new ImpersonateAdminUserUseCase(
      adminRepository,
      roleRepository,
      authProvider,
      impersonation,
    );
    vi.mocked(authProvider.getSession).mockResolvedValue({
      user: { id: "support-1", name: "Sam", email: "sam@example.com" },
      session: {
        id: "session-1",
        userId: "support-1",
        expiresAt: new Date("2099-01-01"),
        activeOrganizationId: null,
        impersonatedBy: null,
      },
    });
    vi.mocked(adminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: false,
    });
  });

  async function expectFailure(
    code: string,
    actorAccess: Parameters<
      typeof useCase.execute
    >[0]["actorAccess"] = SUPPORT_ACCESS,
  ) {
    const result = await useCase.execute({
      actorUserId: "support-1",
      actorAccess,
      userId: "user-1",
    });

    expect(result.isFailure).toBe(true);
    expect((result.error as AdminOperationError).code).toBe(code);
    expect(impersonation.startImpersonation).not.toHaveBeenCalled();
    expect(adminRepository.createAuditLog).not.toHaveBeenCalled();
  }

  it("should start a time-limited impersonation and log it", async () => {
    const result = await useCase.execute({
      actorUserId: "support-1",
      actorAccess: SUPPORT_ACCESS,
      userId: "user-1",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ expiresAt: EXPIRES_AT.toISOString() });
    expect(impersonation.startImpersonation).toHaveBeenCalledWith(
      "user-1",
      IMPERSONATION_SESSION_DURATION_SECONDS,
    );
    expect(adminRepository.createAuditLog).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "support-1",
      action: "admin.impersonation.started",
      resourceType: "user",
      resourceId: "user-1",
      metadata: {
        role: "user",
        expiresAt: EXPIRES_AT.toISOString(),
        durationSeconds: IMPERSONATION_SESSION_DURATION_SECONDS,
      },
    });
  });

  it("should allow a custom role covered by the actor access", async () => {
    vi.mocked(adminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "viewer",
      banned: false,
    });
    vi.mocked(roleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole({ key: "viewer", access: { users: "read" } }),
    );

    const result = await useCase.execute({
      actorUserId: "support-1",
      actorAccess: SUPPORT_ACCESS,
      userId: "user-1",
    });

    expect(result.isSuccess).toBe(true);
  });

  it("should require the impersonation access", async () => {
    await expectFailure("ADMIN_INSUFFICIENT_PERMISSIONS", { users: "write" });
    expect(authProvider.getSession).not.toHaveBeenCalled();
  });

  it("should refuse to nest impersonations", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue({
      user: { id: "user-2", name: "Bob", email: "bob@example.com" },
      session: {
        id: "session-2",
        userId: "user-2",
        expiresAt: new Date("2099-01-01"),
        activeOrganizationId: null,
        impersonatedBy: "support-1",
      },
    });

    await expectFailure("ADMIN_ALREADY_IMPERSONATING");
  });

  it("should fail when the user does not exist", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(null);
    vi.mocked(adminRepository.getUserSecurityState).mockResolvedValue(null);

    await expectFailure("ADMIN_USER_NOT_FOUND");
  });

  it("should refuse to impersonate yourself", async () => {
    vi.mocked(adminRepository.getUserSecurityState).mockResolvedValue({
      id: "support-1",
      role: "support",
      banned: false,
    });

    await expectFailure("ADMIN_CANNOT_IMPERSONATE_SELF");
  });

  it("should refuse to impersonate a banned user", async () => {
    vi.mocked(adminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "user",
      banned: true,
    });

    await expectFailure("ADMIN_CANNOT_IMPERSONATE_BANNED");
  });

  it("should refuse to impersonate an admin even with full access", async () => {
    vi.mocked(adminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "admin",
      banned: false,
    });

    await expectFailure("ADMIN_CANNOT_IMPERSONATE_ADMIN", getFullAccess());
  });

  it("should refuse a user with access the actor lacks", async () => {
    vi.mocked(adminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "manager",
      banned: false,
    });
    vi.mocked(roleRepository.findRoleByKey).mockResolvedValue(
      createCustomRole({ key: "manager", access: { roles: "write" } }),
    );

    await expectFailure("ADMIN_INSUFFICIENT_PERMISSIONS");
  });

  it("should treat an unknown role as having no access", async () => {
    vi.mocked(adminRepository.getUserSecurityState).mockResolvedValue({
      id: "user-1",
      role: "removed-role",
      banned: false,
    });
    vi.mocked(roleRepository.findRoleByKey).mockResolvedValue(null);

    const result = await useCase.execute({
      actorUserId: "support-1",
      actorAccess: SUPPORT_ACCESS,
      userId: "user-1",
    });

    expect(result.isSuccess).toBe(true);
  });
});
