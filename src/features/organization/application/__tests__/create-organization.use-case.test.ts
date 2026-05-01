import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { buildOrganization } from "@/test/utils/entity-builders";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { CreateOrganizationUseCase } from "../use-cases/create-organization.use-case";

describe("CreateOrganizationUseCase", () => {
  let useCase: CreateOrganizationUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new CreateOrganizationUseCase(mockOrganizationManagement);
  });

  it("should create organization and return response DTO", async () => {
    vi.mocked(mockOrganizationManagement.createOrganization).mockResolvedValue(
      buildOrganization({
        id: "org-123",
        name: "Acme",
        slug: "acme",
      }),
    );

    const result = await useCase.execute({
      name: "Acme",
      slug: "acme",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      id: "org-123",
      name: "Acme",
      slug: "acme",
      logo: null,
    });
    expect(mockOrganizationManagement.createOrganization).toHaveBeenCalledWith({
      name: "Acme",
      slug: "acme",
    });
  });

  it("should return failure when organization cannot be created", async () => {
    const error = new OrganizationOperationError(
      "ORGANIZATION_ALREADY_EXISTS",
      "Organization already exists",
    );
    vi.mocked(mockOrganizationManagement.createOrganization).mockRejectedValue(
      error,
    );

    const result = await useCase.execute({
      name: "Acme",
      slug: "acme",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
});
