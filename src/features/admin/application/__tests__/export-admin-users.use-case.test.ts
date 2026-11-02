import { beforeEach, describe, expect, it, vi } from "vitest";

import { EXPORT_BATCH_SIZE } from "@/shared/domain/list-query";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ExportAdminUsersUseCase } from "../use-cases/export-admin-users.use-case";

import { collectBatches, createAdminUser } from "./admin-list-fixtures";
import { createMockAdminRepository } from "./admin-repository.mock";

describe("ExportAdminUsersUseCase", () => {
  let useCase: ExportAdminUsersUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new ExportAdminUsersUseCase(mockAdminRepository);
  });

  it("should audit the export and stream every filtered page", async () => {
    const query = {
      page: 3,
      pageSize: 10,
      sort: "email.asc" as const,
      search: "acme",
      role: ["admin"],
      banned: false,
    };
    vi.mocked(mockAdminRepository.listUsers)
      .mockResolvedValueOnce({
        page: 1,
        pageSize: EXPORT_BATCH_SIZE,
        total: EXPORT_BATCH_SIZE + 1,
        pageCount: 2,
        items: Array.from({ length: EXPORT_BATCH_SIZE }, (_, index) =>
          createAdminUser(`user-${index}`),
        ),
      })
      .mockResolvedValueOnce({
        page: 2,
        pageSize: EXPORT_BATCH_SIZE,
        total: EXPORT_BATCH_SIZE + 1,
        pageCount: 2,
        items: [createAdminUser("user-last")],
      });

    const result = await useCase.execute({ actorUserId: "admin-1", query });
    const batches = await collectBatches(result.value.batches);

    expect(result.isSuccess).toBe(true);
    expect(batches.map((batch) => batch.length)).toEqual([
      EXPORT_BATCH_SIZE,
      1,
    ]);
    expect(mockAdminRepository.createAuditLog).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "admin-1",
      action: "admin.users.exported",
      resourceType: "user",
      metadata: {
        sort: "email.asc",
        search: "acme",
        role: ["admin"],
        banned: false,
      },
    });
    expect(mockAdminRepository.listUsers).toHaveBeenNthCalledWith(1, {
      ...query,
      page: 1,
      pageSize: EXPORT_BATCH_SIZE,
    });
    expect(mockAdminRepository.listUsers).toHaveBeenNthCalledWith(2, {
      ...query,
      page: 2,
      pageSize: EXPORT_BATCH_SIZE,
    });
  });
});
