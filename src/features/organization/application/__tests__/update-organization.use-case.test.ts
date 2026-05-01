import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { buildOrganization } from "@/test/utils/entity-builders";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { UpdateOrganizationUseCase } from "../use-cases/update-organization.use-case";

describe("UpdateOrganizationUseCase", () => {
  let useCase: UpdateOrganizationUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new UpdateOrganizationUseCase(mockOrganizationManagement);
  });

  it("should update organization and return response DTO", async () => {
    vi.mocked(mockOrganizationManagement.updateOrganization).mockResolvedValue(
      buildOrganization({
        name: "Updated Organization",
        slug: "updated-organization",
        logo: "organization-avatars/logo.webp",
      }),
    );

    const result = await useCase.execute({
      organizationId: "org-123",
      name: "Updated Organization",
      slug: "updated-organization",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      id: "org-123",
      name: "Updated Organization",
      slug: "updated-organization",
      logo: "organization-avatars/logo.webp",
    });
  });

  it("should pass nullable logo through to the management port", async () => {
    vi.mocked(mockOrganizationManagement.updateOrganization).mockResolvedValue(
      buildOrganization(),
    );

    await useCase.execute({
      organizationId: "org-123",
      logo: null,
    });

    expect(mockOrganizationManagement.updateOrganization).toHaveBeenCalledWith({
      organizationId: "org-123",
      logo: null,
    });
  });

  it("should return failure when the management port rejects", async () => {
    const error = new OrganizationOperationError(
      "ORGANIZATION_SLUG_ALREADY_TAKEN",
      "Organization slug already taken",
    );
    vi.mocked(mockOrganizationManagement.updateOrganization).mockRejectedValue(
      error,
    );

    const result = await useCase.execute({
      organizationId: "org-123",
      slug: "taken-slug",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
});
