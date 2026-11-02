import { beforeEach, describe, expect, it, vi } from "vitest";

import { EXPORT_BATCH_SIZE } from "@/shared/domain/list-query";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ExportAdminAuditLogsUseCase } from "../use-cases/export-admin-audit-logs.use-case";

import { collectBatches, createAdminAuditLog } from "./admin-list-fixtures";
import { createMockAdminRepository } from "./admin-repository.mock";

describe("ExportAdminAuditLogsUseCase", () => {
  let useCase: ExportAdminAuditLogsUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new ExportAdminAuditLogsUseCase(mockAdminRepository);
  });

  it("should audit the export and stream the filtered audit logs", async () => {
    const query = {
      page: 2,
      pageSize: 50,
      action: ["admin.user.banned"],
      actor: "admin-1",
    };
    vi.mocked(mockAdminRepository.listAuditLogs).mockResolvedValue({
      page: 1,
      pageSize: EXPORT_BATCH_SIZE,
      total: 1,
      pageCount: 1,
      items: [createAdminAuditLog("log-1")],
    });

    const result = await useCase.execute({ actorUserId: "admin-1", query });
    const batches = await collectBatches(result.value.batches);

    expect(result.isSuccess).toBe(true);
    expect(batches).toEqual([[createAdminAuditLog("log-1")]]);
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "admin-1",
      action: "admin.audit-logs.exported",
      resourceType: "audit-log",
      metadata: { action: ["admin.user.banned"], actor: "admin-1" },
    });
    expect(mockAdminRepository.listAuditLogs).toHaveBeenCalledWith({
      ...query,
      page: 1,
      pageSize: EXPORT_BATCH_SIZE,
    });
  });

  it("should not query the audit logs until the export is consumed", async () => {
    const result = await useCase.execute({
      actorUserId: "admin-1",
      query: { page: 1, pageSize: 20 },
    });

    expect(result.isSuccess).toBe(true);
    expect(mockAdminRepository.listAuditLogs).not.toHaveBeenCalled();
  });
});
