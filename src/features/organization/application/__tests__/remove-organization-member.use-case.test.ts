import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { RemoveOrganizationMemberUseCase } from "../use-cases/remove-organization-member.use-case";

describe("RemoveOrganizationMemberUseCase", () => {
  let useCase: RemoveOrganizationMemberUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new RemoveOrganizationMemberUseCase(mockOrganizationManagement);
  });

  it("should remove organization member", async () => {
    vi.mocked(mockOrganizationManagement.removeMember).mockResolvedValue();

    const result = await useCase.execute({
      organizationId: "org-123",
      memberId: "member-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ removed: true });
    expect(mockOrganizationManagement.removeMember).toHaveBeenCalledWith({
      organizationId: "org-123",
      memberId: "member-123",
    });
  });

  it("should return failure when member cannot be removed", async () => {
    const error = new OrganizationOperationError(
      "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER",
      "You are not allowed to delete this member",
    );
    vi.mocked(mockOrganizationManagement.removeMember).mockRejectedValue(error);

    const result = await useCase.execute({
      organizationId: "org-123",
      memberId: "member-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
});
