import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { ListOrganizationInvitationsUseCase } from "../use-cases/list-organization-invitations.use-case";

describe("ListOrganizationInvitationsUseCase", () => {
  let useCase: ListOrganizationInvitationsUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new ListOrganizationInvitationsUseCase(
      mockOrganizationManagement,
    );
  });

  it("should list pending invitations only", async () => {
    vi.mocked(mockOrganizationManagement.listInvitations).mockResolvedValue([
      {
        id: "invitation-pending",
        email: "pending@example.com",
        role: "member",
        organizationId: "org-123",
        status: "pending",
        expiresAt: new Date("2026-05-03T12:00:00.000Z"),
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        id: "invitation-accepted",
        email: "accepted@example.com",
        role: "admin",
        organizationId: "org-123",
        status: "accepted",
        expiresAt: new Date("2026-05-03T12:00:00.000Z"),
        createdAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ]);

    const result = await useCase.execute({ organizationId: "org-123" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([
      {
        id: "invitation-pending",
        email: "pending@example.com",
        role: "member",
        organizationId: "org-123",
        status: "pending",
        expiresAt: "2026-05-03T12:00:00.000Z",
        createdAt: "2026-05-01T12:00:00.000Z",
      },
    ]);
    expect(mockOrganizationManagement.listInvitations).toHaveBeenCalledWith({
      organizationId: "org-123",
    });
  });

  it("should return failure when invitations cannot be listed", async () => {
    const error = new OrganizationOperationError(
      "YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION",
      "You are not allowed to cancel this invitation",
    );
    vi.mocked(mockOrganizationManagement.listInvitations).mockRejectedValue(
      error,
    );

    const result = await useCase.execute({ organizationId: "org-123" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
  it("should wrap non-Error rejections in an Error", async () => {
    vi.mocked(mockOrganizationManagement.listInvitations).mockRejectedValue(
      "boom",
    );

    const result = await useCase.execute({ organizationId: "org-123" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toEqual(new Error("boom"));
  });
});
