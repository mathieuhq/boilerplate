import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import { GetAdminOrganizationDetailsUseCase } from "../use-cases/get-admin-organization-details.use-case";

import { createMockAdminRepository } from "./admin-repository.mock";

describe("GetAdminOrganizationDetailsUseCase", () => {
  let useCase: GetAdminOrganizationDetailsUseCase;
  let mockAdminRepository: IAdminRepository;

  beforeEach(() => {
    mockAdminRepository = createMockAdminRepository();
    useCase = new GetAdminOrganizationDetailsUseCase(mockAdminRepository);
  });

  it("should return the organization details", async () => {
    const organization = {
      id: "org-1",
      name: "Acme",
      slug: "acme",
      createdAt: "2026-01-01T00:00:00.000Z",
      owner: null,
      membersCount: 1,
      pendingInvitationsCount: 0,
      members: [
        {
          id: "member-1",
          role: "owner",
          createdAt: "2026-01-01T00:00:00.000Z",
          user: { id: "user-1", name: "Jane", email: "jane@example.com" },
        },
      ],
      invitations: [],
    };
    vi.mocked(mockAdminRepository.getOrganizationDetails).mockResolvedValue(
      organization,
    );

    const result = await useCase.execute({ organizationId: "org-1" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ organization });
    expect(mockAdminRepository.getOrganizationDetails).toHaveBeenCalledWith({
      organizationId: "org-1",
    });
  });

  it("should return null when the organization does not exist", async () => {
    vi.mocked(mockAdminRepository.getOrganizationDetails).mockResolvedValue(
      null,
    );

    const result = await useCase.execute({ organizationId: "missing" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ organization: null });
  });
});
