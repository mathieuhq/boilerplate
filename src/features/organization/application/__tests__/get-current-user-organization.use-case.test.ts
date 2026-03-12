import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { buildOrganization } from "@/test/utils/entity-builders";
import {
  createMockAuthProvider,
  createMockOrganizationRepository,
} from "@/test/utils/mock-factories";

import { OrganizationAccessDeniedError } from "../../domain/errors/organization-access-denied.error";
import type { IOrganizationRepository } from "../../domain/repositories/organization.repository.interface";
import { GetCurrentUserOrganizationUseCase } from "../use-cases/get-current-user-organization.use-case";

describe("GetCurrentUserOrganizationUseCase", () => {
  let useCase: GetCurrentUserOrganizationUseCase;
  let mockOrganizationRepository: IOrganizationRepository;
  let mockAuthProvider: IAuthProviderPort;

  beforeEach(() => {
    mockOrganizationRepository = createMockOrganizationRepository();
    mockAuthProvider = createMockAuthProvider();
    useCase = new GetCurrentUserOrganizationUseCase(
      mockOrganizationRepository,
      mockAuthProvider,
    );
  });

  it("should return organization when user has admin/owner role", async () => {
    const organization = buildOrganization({
      logo: "https://example.com/logo.png",
    });
    vi.mocked(mockAuthProvider.getRequiredUser).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    vi.mocked(
      mockOrganizationRepository.findByUserIdWithAdminRole,
    ).mockResolvedValue(organization);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.id).toBe("org-123");
    expect(result.value.name).toBe("Test Organization");
    expect(result.value.slug).toBe("test-organization");
    expect(result.value.logo).toBe("https://example.com/logo.png");
  });

  it("should call auth provider to get required user", async () => {
    const organization = buildOrganization();
    vi.mocked(mockAuthProvider.getRequiredUser).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    vi.mocked(
      mockOrganizationRepository.findByUserIdWithAdminRole,
    ).mockResolvedValue(organization);

    await useCase.execute({});

    expect(mockAuthProvider.getRequiredUser).toHaveBeenCalledTimes(1);
  });

  it("should call repository with user id", async () => {
    const organization = buildOrganization();
    vi.mocked(mockAuthProvider.getRequiredUser).mockResolvedValue({
      id: "user-456",
      email: "test@example.com",
      name: "Test User",
    });
    vi.mocked(
      mockOrganizationRepository.findByUserIdWithAdminRole,
    ).mockResolvedValue(organization);

    await useCase.execute({});

    expect(
      mockOrganizationRepository.findByUserIdWithAdminRole,
    ).toHaveBeenCalledWith("user-456");
  });

  it("should return OrganizationAccessDeniedError when user does not have admin/owner role", async () => {
    vi.mocked(mockAuthProvider.getRequiredUser).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    vi.mocked(
      mockOrganizationRepository.findByUserIdWithAdminRole,
    ).mockResolvedValue(null);

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(OrganizationAccessDeniedError);
  });

  it("should return null logo when organization has no logo", async () => {
    const organization = buildOrganization();
    vi.mocked(mockAuthProvider.getRequiredUser).mockResolvedValue({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
    });
    vi.mocked(
      mockOrganizationRepository.findByUserIdWithAdminRole,
    ).mockResolvedValue(organization);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.logo).toBeNull();
  });
});
