import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ListAdminAuditLogsUseCase } from "../use-cases/list-admin-audit-logs.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("ListAdminAuditLogsUseCase", () => {
  let useCase: ListAdminAuditLogsUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new ListAdminAuditLogsUseCase(mockAdminRepository);
  });

  it("should return paginated audit logs with filters", async () => {
    const auditLogs = {
      page: 1,
      pageSize: 20,
      total: 1,
      pageCount: 1,
      items: [
        {
          id: "log-1",
          actorUserId: "admin-1",
          actorType: "user",
          action: "admin.user.banned",
          resourceType: "user",
          resourceId: "user-1",
          organizationId: null,
          metadata: { reason: "abuse" },
          createdAt: "2026-01-01T00:00:00.000Z",
          actorUser: {
            id: "admin-1",
            name: "Admin",
            email: "admin@example.com",
          },
          organization: null,
        },
      ],
    };
    const input = {
      page: 1,
      pageSize: 20,
      sort: "createdAt.desc" as const,
      search: "banned",
      action: ["admin.user.banned"],
      actorType: ["user"],
      resourceType: ["user"],
      actor: "admin-1",
      createdAt: "2026-01-01..2026-01-31",
    };
    vi.mocked(mockAdminRepository.listAuditLogs).mockResolvedValue(auditLogs);

    const result = await useCase.execute(input);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ auditLogs });
    expect(mockAdminRepository.listAuditLogs).toHaveBeenCalledWith(input);
  });
});
