import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { createMockOrganizationManagement } from "@/test/utils/mock-factories";

import { InviteOrganizationMemberUseCase } from "../use-cases/invite-organization-member.use-case";

describe("InviteOrganizationMemberUseCase", () => {
  let useCase: InviteOrganizationMemberUseCase;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new InviteOrganizationMemberUseCase(mockOrganizationManagement);
  });

  it("should invite member and return invitation response DTO", async () => {
    vi.mocked(mockOrganizationManagement.inviteMember).mockResolvedValue({
      id: "invitation-123",
      email: "member@example.com",
      role: "member",
      organizationId: "org-123",
      status: "pending",
      expiresAt: new Date("2026-05-03T12:00:00.000Z"),
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
    });

    const result = await useCase.execute({
      organizationId: "org-123",
      email: "member@example.com",
      role: "member",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      id: "invitation-123",
      email: "member@example.com",
      role: "member",
      organizationId: "org-123",
      status: "pending",
      expiresAt: "2026-05-03T12:00:00.000Z",
      createdAt: "2026-05-01T12:00:00.000Z",
    });
  });

  it("should pass invitation data through to the management port", async () => {
    vi.mocked(mockOrganizationManagement.inviteMember).mockResolvedValue({
      id: "invitation-123",
      email: "admin@example.com",
      role: "admin",
      organizationId: "org-123",
      status: "pending",
      expiresAt: new Date("2026-05-03T12:00:00.000Z"),
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
    });

    await useCase.execute({
      organizationId: "org-123",
      email: "admin@example.com",
      role: "admin",
    });

    expect(mockOrganizationManagement.inviteMember).toHaveBeenCalledWith({
      organizationId: "org-123",
      email: "admin@example.com",
      role: "admin",
    });
  });

  it("should return failure when invitation cannot be created", async () => {
    const error = new OrganizationOperationError(
      "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION",
      "User is already invited to this organization",
    );
    vi.mocked(mockOrganizationManagement.inviteMember).mockRejectedValue(error);

    const result = await useCase.execute({
      organizationId: "org-123",
      email: "member@example.com",
      role: "member",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
  it("should wrap non-Error rejections in an Error", async () => {
    vi.mocked(mockOrganizationManagement.inviteMember).mockRejectedValue(
      "boom",
    );

    const result = await useCase.execute({
      organizationId: "org-123",
      email: "member@example.com",
      role: "member",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toEqual(new Error("boom"));
  });
});
