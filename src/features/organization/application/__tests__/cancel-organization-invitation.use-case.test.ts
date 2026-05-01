import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { CancelOrganizationInvitationUseCase } from "../use-cases/cancel-organization-invitation.use-case";

describe("CancelOrganizationInvitationUseCase", () => {
  let useCase: CancelOrganizationInvitationUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new CancelOrganizationInvitationUseCase(
      mockOrganizationManagement,
    );
  });

  it("should cancel organization invitation", async () => {
    vi.mocked(mockOrganizationManagement.cancelInvitation).mockResolvedValue();

    const result = await useCase.execute({
      invitationId: "invitation-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ canceled: true });
    expect(mockOrganizationManagement.cancelInvitation).toHaveBeenCalledWith({
      invitationId: "invitation-123",
    });
  });

  it("should return failure when invitation cannot be canceled", async () => {
    const error = new OrganizationOperationError(
      "INVITATION_NOT_FOUND",
      "Invitation not found",
    );
    vi.mocked(mockOrganizationManagement.cancelInvitation).mockRejectedValue(
      error,
    );

    const result = await useCase.execute({
      invitationId: "invitation-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
});
