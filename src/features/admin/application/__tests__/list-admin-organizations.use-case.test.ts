import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { ListAdminOrganizationsUseCase } from "../use-cases/list-admin-organizations.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("ListAdminOrganizationsUseCase", () => {
  let useCase: ListAdminOrganizationsUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new ListAdminOrganizationsUseCase(mockAdminRepository);
  });

  it("should return paginated organizations", async () => {
    const organizations = {
      page: 1,
      pageSize: 20,
      total: 1,
      pageCount: 1,
      items: [
        {
          id: "org-1",
          name: "Acme",
          slug: "acme",
          createdAt: "2026-01-01T00:00:00.000Z",
          owner: { id: "user-1", name: "Jane", email: "jane@example.com" },
          membersCount: 3,
          pendingInvitationsCount: 1,
        },
      ],
    };
    const input = {
      page: 1,
      pageSize: 20,
      sort: "members.desc" as const,
      search: "acme",
      createdAt: "2026-01-01..",
    };
    vi.mocked(mockAdminRepository.listOrganizations).mockResolvedValue(
      organizations,
    );

    const result = await useCase.execute(input);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ organizations });
    expect(mockAdminRepository.listOrganizations).toHaveBeenCalledWith(input);
  });
});
