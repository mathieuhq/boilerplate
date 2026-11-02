import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { buildOrganization } from "@/test/utils/entity-builders";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { SetActiveOrganizationUseCase } from "../use-cases/set-active-organization.use-case";

describe("SetActiveOrganizationUseCase", () => {
  let useCase: SetActiveOrganizationUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new SetActiveOrganizationUseCase(mockOrganizationManagement);
  });

  it("should set active organization and return response DTO", async () => {
    vi.mocked(
      mockOrganizationManagement.setActiveOrganization,
    ).mockResolvedValue(
      buildOrganization({
        id: "org-123",
        name: "Acme",
        slug: "acme",
      }),
    );

    const result = await useCase.execute({
      organizationId: "org-123",
    });

    expect(result.isSuccess).toBe(true);

    expect(result.value).toEqual({
      id: "org-123",
      name: "Acme",
      slug: "acme",
      logo: null,
    });
    expect(
      mockOrganizationManagement.setActiveOrganization,
    ).toHaveBeenCalledWith({
      organizationId: "org-123",
    });
  });

  it("should return failure when active organization cannot be set", async () => {
    const error = new OrganizationOperationError(
      "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION",
      "User is not a member of the organization",
    );
    vi.mocked(
      mockOrganizationManagement.setActiveOrganization,
    ).mockRejectedValue(error);

    const result = await useCase.execute({
      organizationId: "org-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
  it("should wrap non-Error rejections in an Error", async () => {
    vi.mocked(
      mockOrganizationManagement.setActiveOrganization,
    ).mockRejectedValue("boom");

    const result = await useCase.execute({
      organizationId: "org-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toEqual(new Error("boom"));
  });
});
