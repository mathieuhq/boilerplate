import { beforeEach, describe, expect, it, vi } from "vitest";

import { Result } from "@/shared/application/result";

import type { OrganizationResponseDTO } from "../../application/dto/organization-response.dto";
import type { AcceptOrganizationInvitationUseCase } from "../../application/use-cases/accept-organization-invitation.use-case";
import type { GetCurrentUserOrganizationUseCase } from "../../application/use-cases/get-current-user-organization.use-case";
import type { UpdateOrganizationUseCase } from "../../application/use-cases/update-organization.use-case";
import { OrganizationAccessDeniedError } from "../../domain/errors/organization-access-denied.error";
import { OrganizationController } from "../controllers/organization.controller";

describe("OrganizationController", () => {
  let controller: OrganizationController;
  let mockGetCurrentUseCase: GetCurrentUserOrganizationUseCase;
  let mockUpdateUseCase: UpdateOrganizationUseCase;
  let mockAcceptInvitationUseCase: AcceptOrganizationInvitationUseCase;

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
    controller = new OrganizationController(
      mockGetCurrentUseCase,
      mockUpdateUseCase,
      mockAcceptInvitationUseCase,
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

      await expect(
        controller.canManageCurrentUserOrganization(),
      ).resolves.toBe(true);
    });

    it("should return false when current organization access is denied", async () => {
      vi.mocked(mockGetCurrentUseCase.execute).mockResolvedValue(
        Result.fail(new OrganizationAccessDeniedError()),
      );

      await expect(
        controller.canManageCurrentUserOrganization(),
      ).resolves.toBe(false);
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
});
