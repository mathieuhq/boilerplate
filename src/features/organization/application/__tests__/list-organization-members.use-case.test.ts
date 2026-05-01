import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/features/auth/application/ports/auth-provider.port";
import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import {
  createMockAuthProvider,
  createMockOrganizationManagement,
} from "@/test/utils/mock-factories";

import { ListOrganizationMembersUseCase } from "../use-cases/list-organization-members.use-case";

describe("ListOrganizationMembersUseCase", () => {
  let useCase: ListOrganizationMembersUseCase;
  let mockAuthProvider: IAuthProviderPort;
  let mockOrganizationManagement: IOrganizationManagementPort;

  beforeEach(() => {
    mockAuthProvider = createMockAuthProvider();
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new ListOrganizationMembersUseCase(
      mockOrganizationManagement,
      mockAuthProvider,
    );
  });

  it("should list members and mark removable rows for an owner", async () => {
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession("owner-user"),
    );
    vi.mocked(mockOrganizationManagement.listMembers).mockResolvedValue([
      buildMember({
        id: "member-owner",
        userId: "owner-user",
        role: "owner",
      }),
      buildMember({
        id: "member-admin",
        userId: "admin-user",
        role: "admin",
      }),
      buildMember({
        id: "member-member",
        userId: "member-user",
        role: "member",
      }),
    ]);

    const result = await useCase.execute({ organizationId: "org-123" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([
      expect.objectContaining({
        id: "member-owner",
        role: "owner",
        isCurrentUser: true,
        canRemove: false,
        status: "active",
      }),
      expect.objectContaining({
        id: "member-admin",
        role: "admin",
        isCurrentUser: false,
        canRemove: true,
        status: "active",
      }),
      expect.objectContaining({
        id: "member-member",
        role: "member",
        isCurrentUser: false,
        canRemove: true,
        status: "active",
      }),
    ]);
    expect(mockOrganizationManagement.listMembers).toHaveBeenCalledWith({
      organizationId: "org-123",
    });
  });

  it("should allow an admin to remove non-owner members only", async () => {
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession("admin-user"),
    );
    vi.mocked(mockOrganizationManagement.listMembers).mockResolvedValue([
      buildMember({
        id: "member-owner",
        userId: "owner-user",
        role: "owner",
      }),
      buildMember({
        id: "member-admin",
        userId: "admin-user",
        role: "admin",
      }),
      buildMember({
        id: "member-member",
        userId: "member-user",
        role: "member",
      }),
    ]);

    const result = await useCase.execute({ organizationId: "org-123" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([
      expect.objectContaining({
        id: "member-owner",
        canRemove: false,
      }),
      expect.objectContaining({
        id: "member-admin",
        canRemove: false,
      }),
      expect.objectContaining({
        id: "member-member",
        canRemove: true,
      }),
    ]);
  });

  it("should allow removing another owner only when more than one owner exists", async () => {
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession("owner-user"),
    );
    vi.mocked(mockOrganizationManagement.listMembers).mockResolvedValue([
      buildMember({
        id: "member-owner",
        userId: "owner-user",
        role: "owner",
      }),
      buildMember({
        id: "member-owner-2",
        userId: "owner-user-2",
        role: "owner",
      }),
    ]);

    const result = await useCase.execute({ organizationId: "org-123" });

    expect(result.isSuccess).toBe(true);
    expect(result.value[1]).toEqual(
      expect.objectContaining({
        id: "member-owner-2",
        canRemove: true,
      }),
    );
  });

  it("should return failure when provider cannot list members", async () => {
    const error = new OrganizationOperationError(
      "YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION",
      "You are not a member of this organization",
    );
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession("owner-user"),
    );
    vi.mocked(mockOrganizationManagement.listMembers).mockRejectedValue(error);

    const result = await useCase.execute({ organizationId: "org-123" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
});

function buildSession(userId: string): AuthSession {
  return {
    user: {
      id: userId,
      name: "Jane Doe",
      email: "jane@example.com",
    },
    session: {
      id: "session-123",
      userId,
      expiresAt: new Date("2026-05-01T12:00:00.000Z"),
      activeOrganizationId: "org-123",
    },
  };
}

function buildMember(input: {
  id: string;
  userId: string;
  role: "owner" | "admin" | "member";
}) {
  return {
    id: input.id,
    userId: input.userId,
    organizationId: "org-123",
    role: input.role,
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
    user: {
      id: input.userId,
      name: input.userId,
      email: `${input.userId}@example.com`,
      image: null,
    },
  };
}
