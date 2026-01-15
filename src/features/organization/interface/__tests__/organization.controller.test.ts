import { beforeEach, describe, expect, it, vi } from "vitest";

import { Result } from "@/shared/application/result";

import type { OrganizationResponseDTO } from "../../application/dto/organization-response.dto";
import type { GetCurrentUserOrganizationUseCase } from "../../application/use-cases/get-current-user-organization.use-case";
import { OrganizationAccessDeniedError } from "../../domain/errors/organization-access-denied.error";
import { OrganizationController } from "../controllers/organization.controller";

describe("OrganizationController", () => {
  let controller: OrganizationController;
  let mockUseCase: GetCurrentUserOrganizationUseCase;

  beforeEach(() => {
    mockUseCase = {
      execute: vi.fn(),
    } as unknown as GetCurrentUserOrganizationUseCase;
    controller = new OrganizationController(mockUseCase);
  });

  describe("getCurrentUserOrganization", () => {
    it("should return organization data when use case succeeds", async () => {
      const organizationDTO: OrganizationResponseDTO = {
        id: "org-123",
        name: "Test Organization",
        slug: "test-organization",
        logo: "https://example.com/logo.png",
      };
      vi.mocked(mockUseCase.execute).mockResolvedValue(
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
      vi.mocked(mockUseCase.execute).mockResolvedValue(
        Result.ok(organizationDTO),
      );

      await controller.getCurrentUserOrganization();

      expect(mockUseCase.execute).toHaveBeenCalledWith({});
    });

    it("should throw error when use case fails", async () => {
      const error = new OrganizationAccessDeniedError();
      vi.mocked(mockUseCase.execute).mockResolvedValue(Result.fail(error));

      await expect(controller.getCurrentUserOrganization()).rejects.toThrow(
        OrganizationAccessDeniedError,
      );
    });

    it("should throw the exact error from use case", async () => {
      const error = new OrganizationAccessDeniedError();
      vi.mocked(mockUseCase.execute).mockResolvedValue(Result.fail(error));

      await expect(controller.getCurrentUserOrganization()).rejects.toThrow(
        "You must be an owner or admin to access organization settings",
      );
    });
  });
});
