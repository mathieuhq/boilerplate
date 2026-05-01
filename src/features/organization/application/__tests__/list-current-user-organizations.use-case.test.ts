import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { buildOrganization } from "@/test/utils/entity-builders";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { ListCurrentUserOrganizationsUseCase } from "../use-cases/list-current-user-organizations.use-case";

describe("ListCurrentUserOrganizationsUseCase", () => {
  let useCase: ListCurrentUserOrganizationsUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new ListCurrentUserOrganizationsUseCase(
      mockOrganizationManagement,
    );
  });

  it("should list current user organizations", async () => {
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue([
      buildOrganization({
        id: "org-123",
        name: "Acme",
        slug: "acme",
        logo: "organization-avatars/acme.webp",
      }),
      buildOrganization({
        id: "org-456",
        name: "Beta",
        slug: "beta",
      }),
    ]);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([
      {
        id: "org-123",
        name: "Acme",
        slug: "acme",
        logo: "organization-avatars/acme.webp",
      },
      {
        id: "org-456",
        name: "Beta",
        slug: "beta",
        logo: null,
      },
    ]);
  });

  it("should return failure when organizations cannot be listed", async () => {
    const error = new OrganizationOperationError(
      "ORGANIZATION_OPERATION_FAILED",
      "Failed to list organizations",
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockRejectedValue(
      error,
    );

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
});
