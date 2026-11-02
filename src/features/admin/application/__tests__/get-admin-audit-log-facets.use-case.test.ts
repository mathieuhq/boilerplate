import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { GetAdminAuditLogFacetsUseCase } from "../use-cases/get-admin-audit-log-facets.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("GetAdminAuditLogFacetsUseCase", () => {
  let useCase: GetAdminAuditLogFacetsUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new GetAdminAuditLogFacetsUseCase(mockAdminRepository);
  });

  it("should return the distinct audit log values", async () => {
    const facets = {
      actions: ["admin.user.banned", "admin.role.created"],
      actorTypes: ["system", "user"],
      resourceTypes: ["role", "user"],
    };
    vi.mocked(mockAdminRepository.getAuditLogFacets).mockResolvedValue(facets);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ facets });
  });
});
