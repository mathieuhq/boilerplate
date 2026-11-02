import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import {
  createMockAuthProvider,
  createMockOrganizationRepository,
} from "@/test/utils/mock-factories";

import { Organization } from "../../domain/entities/organization.entity";
import { OrganizationAccessDeniedError } from "../../domain/errors/organization-access-denied.error";
import type {
  IOrganizationAuditLogRepository,
  OrganizationAuditLogPage,
} from "../../domain/repositories/organization-audit-log.repository.interface";
import type { IOrganizationRepository } from "../../domain/repositories/organization.repository.interface";
import { ListOrganizationAuditLogsUseCase } from "../use-cases/list-organization-audit-logs.use-case";

const PAGE: OrganizationAuditLogPage = {
  items: [
    {
      id: "log-1",
      action: "organization.member.removed",
      actorType: "user",
      resourceType: "member",
      resourceId: "member-1",
      metadata: { role: "member" },
      createdAt: "2026-11-02T10:00:00.000Z",
      actorUser: { id: "user-1", name: "Ada", email: "ada@example.com" },
    },
  ],
  total: 1,
  page: 1,
  limit: 20,
  pageCount: 1,
};

describe("ListOrganizationAuditLogsUseCase", () => {
  let organizationRepository: IOrganizationRepository;
  let auditLogRepository: IOrganizationAuditLogRepository;
  let authProvider: IAuthProviderPort;
  let useCase: ListOrganizationAuditLogsUseCase;

  beforeEach(() => {
    organizationRepository = createMockOrganizationRepository();
    auditLogRepository = { listByOrganization: vi.fn() };
    authProvider = createMockAuthProvider();
    useCase = new ListOrganizationAuditLogsUseCase(
      organizationRepository,
      auditLogRepository,
      authProvider,
    );
  });

  it("should list logs of the organization the user manages only", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue({
      user: { id: "user-1", name: "Ada", email: "ada@example.com" },
      session: {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date("2099-01-01"),
        activeOrganizationId: "org-1",
      },
    });
    vi.mocked(organizationRepository.findManageableByUser).mockResolvedValue(
      Organization.create({ id: "org-1", name: "Acme", slug: "acme" }),
    );
    vi.mocked(auditLogRepository.listByOrganization).mockResolvedValue(PAGE);

    const result = await useCase.execute({ page: 2.7, limit: 500 });

    expect(organizationRepository.findManageableByUser).toHaveBeenCalledWith(
      "user-1",
      "org-1",
    );
    expect(auditLogRepository.listByOrganization).toHaveBeenCalledWith({
      organizationId: "org-1",
      page: 2,
      limit: 100,
    });
    expect(result.value).toEqual({
      organization: { id: "org-1", name: "Acme" },
      auditLogs: PAGE,
    });
  });

  it("should clamp invalid pagination to the first page", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue({
      user: { id: "user-1", name: "Ada", email: "ada@example.com" },
      session: {
        id: "session-1",
        userId: "user-1",
        expiresAt: new Date("2099-01-01"),
        activeOrganizationId: null,
      },
    });
    vi.mocked(organizationRepository.findManageableByUser).mockResolvedValue(
      Organization.create({ id: "org-1", name: "Acme", slug: "acme" }),
    );
    vi.mocked(auditLogRepository.listByOrganization).mockResolvedValue(PAGE);

    await useCase.execute({ page: -3, limit: 0 });

    expect(auditLogRepository.listByOrganization).toHaveBeenCalledWith({
      organizationId: "org-1",
      page: 1,
      limit: 1,
    });
  });

  it("should deny access without a session", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue(null);

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.error).toBeInstanceOf(OrganizationAccessDeniedError);
    expect(auditLogRepository.listByOrganization).not.toHaveBeenCalled();
  });

  it("should deny access to members who are not owner or admin", async () => {
    vi.mocked(authProvider.getSession).mockResolvedValue({
      user: { id: "user-2", name: "Bob", email: "bob@example.com" },
      session: {
        id: "session-2",
        userId: "user-2",
        expiresAt: new Date("2099-01-01"),
        activeOrganizationId: "org-1",
      },
    });
    vi.mocked(organizationRepository.findManageableByUser).mockResolvedValue(
      null,
    );

    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.error).toBeInstanceOf(OrganizationAccessDeniedError);
    expect(auditLogRepository.listByOrganization).not.toHaveBeenCalled();
  });
});
