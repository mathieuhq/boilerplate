import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { AcceptOrganizationInvitationUseCase } from "../use-cases/accept-organization-invitation.use-case";

describe("AcceptOrganizationInvitationUseCase", () => {
  let useCase: AcceptOrganizationInvitationUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new AcceptOrganizationInvitationUseCase(
      mockOrganizationManagement,
    );
  });

  it("should accept invitation and return success output", async () => {
    vi.mocked(mockOrganizationManagement.acceptInvitation).mockResolvedValue();

    const result = await useCase.execute({
      invitationId: "invitation-123",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({ accepted: true });
    expect(mockOrganizationManagement.acceptInvitation).toHaveBeenCalledWith(
      "invitation-123",
    );
  });

  it("should return failure when invitation cannot be accepted", async () => {
    const error = new OrganizationOperationError(
      "INVITATION_NOT_FOUND",
      "Invitation not found",
    );
    vi.mocked(mockOrganizationManagement.acceptInvitation).mockRejectedValue(
      error,
    );

    const result = await useCase.execute({
      invitationId: "invitation-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
  it("should wrap non-Error rejections in an Error", async () => {
    vi.mocked(mockOrganizationManagement.acceptInvitation).mockRejectedValue(
      "boom",
    );

    const result = await useCase.execute({
      invitationId: "invitation-123",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toEqual(new Error("boom"));
  });
});
