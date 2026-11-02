import { beforeEach, describe, expect, it, vi } from "vitest";

import { EXPORT_BATCH_SIZE } from "@/shared/domain/list-query";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ExportAdminOrganizationsUseCase } from "../use-cases/export-admin-organizations.use-case";

import { collectBatches, createAdminOrganization } from "./admin-list-fixtures";
import { createMockAdminRepository } from "./admin-repository.mock";

describe("ExportAdminOrganizationsUseCase", () => {
  let useCase: ExportAdminOrganizationsUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new ExportAdminOrganizationsUseCase(mockAdminRepository);
  });

  it("should audit the export and stream the filtered organizations", async () => {
    const query = {
      page: 1,
      pageSize: 20,
      createdAt: "2026-01-01..2026-01-31",
    };
    vi.mocked(mockAdminRepository.listOrganizations).mockResolvedValue({
      page: 1,
      pageSize: EXPORT_BATCH_SIZE,
      total: 2,
      pageCount: 1,
      items: [
        createAdminOrganization("org-1"),
        createAdminOrganization("org-2"),
      ],
    });

    const result = await useCase.execute({ actorUserId: "admin-1", query });
    const batches = await collectBatches(result.value.batches);

    expect(result.isSuccess).toBe(true);
    expect(batches).toHaveLength(1);
    expect(batches[0].map((organization) => organization.id)).toEqual([
      "org-1",
      "org-2",
    ]);
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "admin-1",
      action: "admin.organizations.exported",
      resourceType: "organization",
      metadata: { createdAt: "2026-01-01..2026-01-31" },
    });
    expect(mockAdminRepository.listOrganizations).toHaveBeenCalledTimes(1);
  });
});
