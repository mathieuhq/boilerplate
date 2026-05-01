import { beforeEach, describe, expect, it, vi } from "vitest";

import { Result } from "@/shared/application/result";

import type { OrganizationResponseDTO } from "../../application/dto/organization-response.dto";
import type { AcceptOrganizationInvitationUseCase } from "../../application/use-cases/accept-organization-invitation.use-case";
import type { CancelOrganizationInvitationUseCase } from "../../application/use-cases/cancel-organization-invitation.use-case";
import type { CreateOrganizationUseCase } from "../../application/use-cases/create-organization.use-case";
import type { GetCurrentUserOrganizationUseCase } from "../../application/use-cases/get-current-user-organization.use-case";
import type { InviteOrganizationMemberUseCase } from "../../application/use-cases/invite-organization-member.use-case";
import type { ListCurrentUserOrganizationsUseCase } from "../../application/use-cases/list-current-user-organizations.use-case";
import type { ListOrganizationInvitationsUseCase } from "../../application/use-cases/list-organization-invitations.use-case";
import type { ListOrganizationMembersUseCase } from "../../application/use-cases/list-organization-members.use-case";
import type { RemoveOrganizationMemberUseCase } from "../../application/use-cases/remove-organization-member.use-case";
import type { ResolveActiveOrganizationUseCase } from "../../application/use-cases/resolve-active-organization.use-case";
import type { SetActiveOrganizationUseCase } from "../../application/use-cases/set-active-organization.use-case";
import type { UpdateOrganizationUseCase } from "../../application/use-cases/update-organization.use-case";
import { OrganizationAccessDeniedError } from "../../domain/errors/organization-access-denied.error";
import { OrganizationController } from "../controllers/organization.controller";

describe("OrganizationController", () => {
  let controller: OrganizationController;
  let mockGetCurrentUseCase: GetCurrentUserOrganizationUseCase;
  let mockUpdateUseCase: UpdateOrganizationUseCase;
  let mockAcceptInvitationUseCase: AcceptOrganizationInvitationUseCase;
  let mockInviteMemberUseCase: InviteOrganizationMemberUseCase;
  let mockListOrganizationsUseCase: ListCurrentUserOrganizationsUseCase;
  let mockCreateOrganizationUseCase: CreateOrganizationUseCase;
  let mockSetActiveOrganizationUseCase: SetActiveOrganizationUseCase;
  let mockResolveActiveOrganizationUseCase: ResolveActiveOrganizationUseCase;
  let mockListOrganizationMembersUseCase: ListOrganizationMembersUseCase;
  let mockRemoveOrganizationMemberUseCase: RemoveOrganizationMemberUseCase;
  let mockListOrganizationInvitationsUseCase: ListOrganizationInvitationsUseCase;
  let mockCancelOrganizationInvitationUseCase: CancelOrganizationInvitationUseCase;

  beforeEach(() => {
    mockGetCurrentUseCase = {
      execute: vi.fn(),
    } as unknown as GetCurrentUserOrganizationUseCase;
    mockUpdateUseCase = {
      execute: vi.fn(),
    } as unknown as UpdateOrganizationUseCase;
    mockAcceptInvitationUseCase = {
      execute: vi.fn(),
    } as unknown as AcceptOrganizationInvitationUseCase;
    mockInviteMemberUseCase = {
      execute: vi.fn(),
    } as unknown as InviteOrganizationMemberUseCase;
    mockListOrganizationsUseCase = {
      execute: vi.fn(),
    } as unknown as ListCurrentUserOrganizationsUseCase;
    mockCreateOrganizationUseCase = {
      execute: vi.fn(),
    } as unknown as CreateOrganizationUseCase;
    mockSetActiveOrganizationUseCase = {
      execute: vi.fn(),
    } as unknown as SetActiveOrganizationUseCase;
    mockResolveActiveOrganizationUseCase = {
      execute: vi.fn(),
    } as unknown as ResolveActiveOrganizationUseCase;
    mockListOrganizationMembersUseCase = {
      execute: vi.fn(),
    } as unknown as ListOrganizationMembersUseCase;
    mockRemoveOrganizationMemberUseCase = {
      execute: vi.fn(),
    } as unknown as RemoveOrganizationMemberUseCase;
    mockListOrganizationInvitationsUseCase = {
      execute: vi.fn(),
    } as unknown as ListOrganizationInvitationsUseCase;
    mockCancelOrganizationInvitationUseCase = {
      execute: vi.fn(),
    } as unknown as CancelOrganizationInvitationUseCase;
    controller = new OrganizationController(
      mockGetCurrentUseCase,
      mockUpdateUseCase,
      mockAcceptInvitationUseCase,
      mockInviteMemberUseCase,
      mockListOrganizationsUseCase,
      mockCreateOrganizationUseCase,
      mockSetActiveOrganizationUseCase,
      mockResolveActiveOrganizationUseCase,
      mockListOrganizationMembersUseCase,
      mockRemoveOrganizationMemberUseCase,
      mockListOrganizationInvitationsUseCase,
      mockCancelOrganizationInvitationUseCase,
    );
  });

  describe("getCurrentUserOrganization", () => {
    it("should return organization data when use case succeeds", async () => {
      const organizationDTO: OrganizationResponseDTO = {
        id: "org-123",
        name: "Test Organization",
        slug: "test-organization",
        logo: "https://example.com/logo.png",
      };
      vi.mocked(mockGetCurrentUseCase.execute).mockResolvedValue(
        Result.ok(organizationDTO),
      );

      const result = await controller.getCurrentUserOrganization();

      expect(result).toEqual(organizationDTO);
    });

    it("should call use case with empty object", async () => {
      const organizationDTO: OrganizationResponseDTO = {
        id: "org-123",
        name: "Test Organization",
        slug: "test-organization",
        logo: null,
      };
      vi.mocked(mockGetCurrentUseCase.execute).mockResolvedValue(
        Result.ok(organizationDTO),
      );

      await controller.getCurrentUserOrganization();

      expect(mockGetCurrentUseCase.execute).toHaveBeenCalledWith({});
    });

    it("should throw error when use case fails", async () => {
      const error = new OrganizationAccessDeniedError();
      vi.mocked(mockGetCurrentUseCase.execute).mockResolvedValue(
        Result.fail(error),
      );

      await expect(controller.getCurrentUserOrganization()).rejects.toThrow(
        OrganizationAccessDeniedError,
      );
    });

    it("should throw the exact error from use case", async () => {
      const error = new OrganizationAccessDeniedError();
      vi.mocked(mockGetCurrentUseCase.execute).mockResolvedValue(
        Result.fail(error),
      );

      await expect(controller.getCurrentUserOrganization()).rejects.toThrow(
        "You must be an owner or admin to access organization settings",
      );
    });
  });

  describe("canManageCurrentUserOrganization", () => {
    it("should return true when current organization can be loaded", async () => {
      vi.mocked(mockGetCurrentUseCase.execute).mockResolvedValue(
        Result.ok({
          id: "org-123",
          name: "Test Organization",
          slug: "test-organization",
          logo: null,
        }),
      );

      await expect(controller.canManageCurrentUserOrganization()).resolves.toBe(
        true,
      );
    });

    it("should return false when current organization access is denied", async () => {
      vi.mocked(mockGetCurrentUseCase.execute).mockResolvedValue(
        Result.fail(new OrganizationAccessDeniedError()),
      );

      await expect(controller.canManageCurrentUserOrganization()).resolves.toBe(
        false,
      );
    });
  });

  describe("updateOrganization", () => {
    it("should return updated organization data when use case succeeds", async () => {
      const organizationDTO: OrganizationResponseDTO = {
        id: "org-123",
        name: "Updated Organization",
        slug: "updated-organization",
        logo: null,
      };
      vi.mocked(mockUpdateUseCase.execute).mockResolvedValue(
        Result.ok(organizationDTO),
      );

      const result = await controller.updateOrganization({
        organizationId: "org-123",
        name: "Updated Organization",
      });

      expect(result).toEqual(organizationDTO);
    });

    it("should throw update use case errors", async () => {
      const error = new Error("Update failed");
      vi.mocked(mockUpdateUseCase.execute).mockResolvedValue(
        Result.fail(error),
      );

      await expect(
        controller.updateOrganization({ organizationId: "org-123" }),
      ).rejects.toThrow("Update failed");
    });
  });

  describe("listCurrentUserOrganizations", () => {
    it("should return current user organizations", async () => {
      vi.mocked(mockListOrganizationsUseCase.execute).mockResolvedValue(
        Result.ok([
          {
            id: "org-123",
            name: "Test Organization",
            slug: "test-organization",
            logo: null,
          },
        ]),
      );

      const result = await controller.listCurrentUserOrganizations();

      expect(result).toEqual([
        {
          id: "org-123",
          name: "Test Organization",
          slug: "test-organization",
          logo: null,
        },
      ]);
      expect(mockListOrganizationsUseCase.execute).toHaveBeenCalledWith({});
    });

    it("should throw list use case errors", async () => {
      vi.mocked(mockListOrganizationsUseCase.execute).mockResolvedValue(
        Result.fail(new Error("List failed")),
      );

      await expect(controller.listCurrentUserOrganizations()).rejects.toThrow(
        "List failed",
      );
    });
  });

  describe("createOrganization", () => {
    it("should create an organization through the use case", async () => {
      const organizationDTO: OrganizationResponseDTO = {
        id: "org-123",
        name: "Test Organization",
        slug: "test-organization",
        logo: null,
      };
      vi.mocked(mockCreateOrganizationUseCase.execute).mockResolvedValue(
        Result.ok(organizationDTO),
      );

      const result = await controller.createOrganization({
        name: "Test Organization",
        slug: "test-organization",
      });

      expect(result).toEqual(organizationDTO);
      expect(mockCreateOrganizationUseCase.execute).toHaveBeenCalledWith({
        name: "Test Organization",
        slug: "test-organization",
      });
    });

    it("should throw create use case errors", async () => {
      vi.mocked(mockCreateOrganizationUseCase.execute).mockResolvedValue(
        Result.fail(new Error("Create failed")),
      );

      await expect(
        controller.createOrganization({
          name: "Test Organization",
          slug: "test-organization",
        }),
      ).rejects.toThrow("Create failed");
    });
  });

  describe("setActiveOrganization", () => {
    it("should set active organization through the use case", async () => {
      const organizationDTO: OrganizationResponseDTO = {
        id: "org-123",
        name: "Test Organization",
        slug: "test-organization",
        logo: null,
      };
      vi.mocked(mockSetActiveOrganizationUseCase.execute).mockResolvedValue(
        Result.ok(organizationDTO),
      );

      const result = await controller.setActiveOrganization({
        organizationId: "org-123",
      });

      expect(result).toEqual(organizationDTO);
      expect(mockSetActiveOrganizationUseCase.execute).toHaveBeenCalledWith({
        organizationId: "org-123",
      });
    });

    it("should throw set active use case errors", async () => {
      vi.mocked(mockSetActiveOrganizationUseCase.execute).mockResolvedValue(
        Result.fail(new Error("Switch failed")),
      );

      await expect(
        controller.setActiveOrganization({ organizationId: "org-123" }),
      ).rejects.toThrow("Switch failed");
    });
  });

  describe("resolveActiveOrganization", () => {
    it("should return resolved organization state", async () => {
      vi.mocked(mockResolveActiveOrganizationUseCase.execute).mockResolvedValue(
        Result.ok({
          activeOrganizationId: "org-123",
          organizations: [
            {
              id: "org-123",
              name: "Test Organization",
              slug: "test-organization",
              logo: null,
            },
          ],
        }),
      );

      const result = await controller.resolveActiveOrganization();

      expect(result).toEqual({
        activeOrganizationId: "org-123",
        organizations: [
          {
            id: "org-123",
            name: "Test Organization",
            slug: "test-organization",
            logo: null,
          },
        ],
      });
      expect(mockResolveActiveOrganizationUseCase.execute).toHaveBeenCalledWith(
        {},
      );
    });

    it("should throw resolve use case errors", async () => {
      vi.mocked(mockResolveActiveOrganizationUseCase.execute).mockResolvedValue(
        Result.fail(new Error("Resolve failed")),
      );

      await expect(controller.resolveActiveOrganization()).rejects.toThrow(
        "Resolve failed",
      );
    });
  });

  describe("listMembers", () => {
    it("should list organization members through the use case", async () => {
      vi.mocked(mockListOrganizationMembersUseCase.execute).mockResolvedValue(
        Result.ok([
          {
            id: "member-123",
            userId: "user-123",
            organizationId: "org-123",
            role: "owner",
            status: "active",
            createdAt: "2026-05-01T12:00:00.000Z",
            isCurrentUser: true,
            canRemove: false,
            user: {
              id: "user-123",
              name: "Jane Doe",
              email: "jane@example.com",
              image: null,
            },
          },
        ]),
      );

      const result = await controller.listMembers({
        organizationId: "org-123",
      });

      expect(result).toEqual([
        {
          id: "member-123",
          userId: "user-123",
          organizationId: "org-123",
          role: "owner",
          status: "active",
          createdAt: "2026-05-01T12:00:00.000Z",
          isCurrentUser: true,
          canRemove: false,
          user: {
            id: "user-123",
            name: "Jane Doe",
            email: "jane@example.com",
            image: null,
          },
        },
      ]);
      expect(mockListOrganizationMembersUseCase.execute).toHaveBeenCalledWith({
        organizationId: "org-123",
      });
    });

    it("should throw list members use case errors", async () => {
      vi.mocked(mockListOrganizationMembersUseCase.execute).mockResolvedValue(
        Result.fail(new Error("List members failed")),
      );

      await expect(
        controller.listMembers({ organizationId: "org-123" }),
      ).rejects.toThrow("List members failed");
    });
  });

  describe("removeMember", () => {
    it("should remove organization member through the use case", async () => {
      vi.mocked(mockRemoveOrganizationMemberUseCase.execute).mockResolvedValue(
        Result.ok({ removed: true }),
      );

      const result = await controller.removeMember({
        organizationId: "org-123",
        memberId: "member-123",
      });

      expect(result).toEqual({ removed: true });
      expect(mockRemoveOrganizationMemberUseCase.execute).toHaveBeenCalledWith({
        organizationId: "org-123",
        memberId: "member-123",
      });
    });

    it("should throw remove member use case errors", async () => {
      vi.mocked(mockRemoveOrganizationMemberUseCase.execute).mockResolvedValue(
        Result.fail(new Error("Remove failed")),
      );

      await expect(
        controller.removeMember({
          organizationId: "org-123",
          memberId: "member-123",
        }),
      ).rejects.toThrow("Remove failed");
    });
  });

  describe("listInvitations", () => {
    it("should list organization invitations through the use case", async () => {
      vi.mocked(
        mockListOrganizationInvitationsUseCase.execute,
      ).mockResolvedValue(
        Result.ok([
          {
            id: "invitation-123",
            email: "member@example.com",
            organizationId: "org-123",
            role: "member",
            status: "pending",
            expiresAt: "2026-05-03T12:00:00.000Z",
            createdAt: "2026-05-01T12:00:00.000Z",
          },
        ]),
      );

      const result = await controller.listInvitations({
        organizationId: "org-123",
      });

      expect(result).toEqual([
        {
          id: "invitation-123",
          email: "member@example.com",
          organizationId: "org-123",
          role: "member",
          status: "pending",
          expiresAt: "2026-05-03T12:00:00.000Z",
          createdAt: "2026-05-01T12:00:00.000Z",
        },
      ]);
      expect(
        mockListOrganizationInvitationsUseCase.execute,
      ).toHaveBeenCalledWith({
        organizationId: "org-123",
      });
    });

    it("should throw list invitations use case errors", async () => {
      vi.mocked(
        mockListOrganizationInvitationsUseCase.execute,
      ).mockResolvedValue(Result.fail(new Error("List invitations failed")));

      await expect(
        controller.listInvitations({ organizationId: "org-123" }),
      ).rejects.toThrow("List invitations failed");
    });
  });

  describe("cancelInvitation", () => {
    it("should cancel organization invitation through the use case", async () => {
      vi.mocked(
        mockCancelOrganizationInvitationUseCase.execute,
      ).mockResolvedValue(Result.ok({ canceled: true }));

      const result = await controller.cancelInvitation({
        invitationId: "invitation-123",
      });

      expect(result).toEqual({ canceled: true });
      expect(
        mockCancelOrganizationInvitationUseCase.execute,
      ).toHaveBeenCalledWith({
        invitationId: "invitation-123",
      });
    });

    it("should throw cancel invitation use case errors", async () => {
      vi.mocked(
        mockCancelOrganizationInvitationUseCase.execute,
      ).mockResolvedValue(Result.fail(new Error("Cancel failed")));

      await expect(
        controller.cancelInvitation({ invitationId: "invitation-123" }),
      ).rejects.toThrow("Cancel failed");
    });
  });

  describe("acceptInvitation", () => {
    it("should accept an invitation through the use case", async () => {
      vi.mocked(mockAcceptInvitationUseCase.execute).mockResolvedValue(
        Result.ok({ accepted: true }),
      );

      const result = await controller.acceptInvitation("invitation-123");

      expect(result).toEqual({ accepted: true });
      expect(mockAcceptInvitationUseCase.execute).toHaveBeenCalledWith({
        invitationId: "invitation-123",
      });
    });

    it("should throw invitation use case errors", async () => {
      vi.mocked(mockAcceptInvitationUseCase.execute).mockResolvedValue(
        Result.fail(new Error("Invitation not found")),
      );

      await expect(
        controller.acceptInvitation("invitation-123"),
      ).rejects.toThrow("Invitation not found");
    });
  });

  describe("inviteMember", () => {
    it("should invite a member through the use case", async () => {
      vi.mocked(mockInviteMemberUseCase.execute).mockResolvedValue(
        Result.ok({
          id: "invitation-123",
          email: "member@example.com",
          role: "member",
          organizationId: "org-123",
          status: "pending",
          expiresAt: "2026-05-03T12:00:00.000Z",
          createdAt: "2026-05-01T12:00:00.000Z",
        }),
      );

      const result = await controller.inviteMember({
        organizationId: "org-123",
        email: "member@example.com",
        role: "member",
      });

      expect(result).toEqual({
        id: "invitation-123",
        email: "member@example.com",
        role: "member",
        organizationId: "org-123",
        status: "pending",
        expiresAt: "2026-05-03T12:00:00.000Z",
        createdAt: "2026-05-01T12:00:00.000Z",
      });
      expect(mockInviteMemberUseCase.execute).toHaveBeenCalledWith({
        organizationId: "org-123",
        email: "member@example.com",
        role: "member",
      });
    });

    it("should throw invitation use case errors", async () => {
      vi.mocked(mockInviteMemberUseCase.execute).mockResolvedValue(
        Result.fail(new Error("User is already invited")),
      );

      await expect(
        controller.inviteMember({
          organizationId: "org-123",
          email: "member@example.com",
          role: "member",
        }),
      ).rejects.toThrow("User is already invited");
    });
  });
});
