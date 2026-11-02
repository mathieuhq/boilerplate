import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthSession } from "@/features/auth/application/ports/auth-provider.port";
import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import { buildOrganization } from "@/test/utils/entity-builders";
import {
  createMockAuthProvider,
  createMockOrganizationManagement,
} from "@/test/utils/mock-factories";

import { ResolveActiveOrganizationUseCase } from "../use-cases/resolve-active-organization.use-case";

describe("ResolveActiveOrganizationUseCase", () => {
  let useCase: ResolveActiveOrganizationUseCase;
  let mockAuthProvider: IAuthProviderPort;
  let mockOrganizationManagement: IOrganizationManagementPort;
  let suffixes: string[];

  beforeEach(() => {
    suffixes = ["abc123", "def456", "ghi789"];
    mockAuthProvider = createMockAuthProvider();
    mockOrganizationManagement = createMockOrganizationManagement();
    useCase = new ResolveActiveOrganizationUseCase(
      mockOrganizationManagement,
      mockAuthProvider,
      () => suffixes.shift() ?? "fallback",
    );
  });

  it("should keep current active organization when it is listed", async () => {
    const activeOrganization = buildOrganization({
      id: "org-active",
      name: "Active Organization",
      slug: "active-organization",
    });
    const otherOrganization = buildOrganization({
      id: "org-other",
      name: "Other Organization",
      slug: "other-organization",
    });
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession("org-active"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue([
      activeOrganization,
      otherOrganization,
    ]);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      activeOrganizationId: "org-active",
      organizations: [
        {
          id: "org-active",
          name: "Active Organization",
          slug: "active-organization",
          logo: null,
        },
        {
          id: "org-other",
          name: "Other Organization",
          slug: "other-organization",
          logo: null,
        },
      ],
    });
    expect(
      mockOrganizationManagement.setActiveOrganization,
    ).not.toHaveBeenCalled();
    expect(
      mockOrganizationManagement.createOrganization,
    ).not.toHaveBeenCalled();
  });

  it("should set first organization active when session has no active organization", async () => {
    const organization = buildOrganization({
      id: "org-123",
      name: "Acme",
      slug: "acme",
    });
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession(null),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue([
      organization,
    ]);
    vi.mocked(
      mockOrganizationManagement.setActiveOrganization,
    ).mockResolvedValue(organization);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      activeOrganizationId: "org-123",
      organizations: [
        {
          id: "org-123",
          name: "Acme",
          slug: "acme",
          logo: null,
        },
      ],
    });
    expect(
      mockOrganizationManagement.setActiveOrganization,
    ).toHaveBeenCalledWith({
      organizationId: "org-123",
    });
    expect(
      mockOrganizationManagement.createOrganization,
    ).not.toHaveBeenCalled();
  });

  it("should set first organization active when session active organization is stale", async () => {
    const organization = buildOrganization({
      id: "org-123",
      name: "Acme",
      slug: "acme",
    });
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession("org-stale"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue([
      organization,
    ]);
    vi.mocked(
      mockOrganizationManagement.setActiveOrganization,
    ).mockResolvedValue(organization);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.activeOrganizationId).toBe("org-123");
    expect(
      mockOrganizationManagement.setActiveOrganization,
    ).toHaveBeenCalledWith({
      organizationId: "org-123",
    });
  });

  it("should create a default organization when none are listed", async () => {
    const organization = buildOrganization({
      id: "org-created",
      name: "My Organization",
      slug: "jane-doe-abc123",
    });
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession(null, "jane.doe@example.com"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue(
      [],
    );
    vi.mocked(mockOrganizationManagement.createOrganization).mockResolvedValue(
      organization,
    );

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      activeOrganizationId: "org-created",
      organizations: [
        {
          id: "org-created",
          name: "My Organization",
          slug: "jane-doe-abc123",
          logo: null,
        },
      ],
    });
    expect(mockOrganizationManagement.createOrganization).toHaveBeenCalledWith({
      name: "My Organization",
      slug: "jane-doe-abc123",
    });
    expect(
      mockOrganizationManagement.setActiveOrganization,
    ).not.toHaveBeenCalled();
  });

  it("should retry default organization creation when generated slug already exists", async () => {
    const slugConflict = new OrganizationOperationError(
      "ORGANIZATION_ALREADY_EXISTS",
      "Organization already exists",
    );
    const organization = buildOrganization({
      id: "org-created",
      name: "My Organization",
      slug: "jane-doe-def456",
    });
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession(null, "jane.doe@example.com"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue(
      [],
    );
    vi.mocked(mockOrganizationManagement.createOrganization)
      .mockRejectedValueOnce(slugConflict)
      .mockResolvedValueOnce(organization);

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(result.value.activeOrganizationId).toBe("org-created");
    expect(
      mockOrganizationManagement.createOrganization,
    ).toHaveBeenNthCalledWith(1, {
      name: "My Organization",
      slug: "jane-doe-abc123",
    });
    expect(
      mockOrganizationManagement.createOrganization,
    ).toHaveBeenNthCalledWith(2, {
      name: "My Organization",
      slug: "jane-doe-def456",
    });
  });

  it("should return failure when provider cannot set fallback organization active", async () => {
    const organization = buildOrganization({
      id: "org-123",
      name: "Acme",
      slug: "acme",
    });
    const error = new OrganizationOperationError(
      "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION",
      "User is not a member of the organization",
    );
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession("org-stale"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue([
      organization,
    ]);
    vi.mocked(
      mockOrganizationManagement.setActiveOrganization,
    ).mockRejectedValue(error);

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });

  it("should return failure when there is no session", async () => {
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(null);

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect((result.error as OrganizationOperationError).code).toBe(
      "ORGANIZATION_SESSION_REQUIRED",
    );
    expect(mockAuthProvider.getRequiredUser).toHaveBeenCalled();
    expect(mockOrganizationManagement.listOrganizations).not.toHaveBeenCalled();
  });

  it("should wrap non-Error rejections in an Error", async () => {
    vi.mocked(mockAuthProvider.getSession).mockRejectedValue("boom");

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect(result.error).toEqual(new Error("boom"));
  });

  it("should retry when the generated slug is already taken", async () => {
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession(null, "jane.doe@example.com"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue(
      [],
    );
    vi.mocked(mockOrganizationManagement.createOrganization)
      .mockRejectedValueOnce(
        new OrganizationOperationError(
          "ORGANIZATION_SLUG_ALREADY_TAKEN",
          "Slug already taken",
        ),
      )
      .mockResolvedValueOnce(buildOrganization({ id: "org-created" }));

    const result = await useCase.execute({});

    expect(result.isSuccess).toBe(true);
    expect(mockOrganizationManagement.createOrganization).toHaveBeenCalledTimes(
      2,
    );
  });

  it("should stop retrying after the maximum number of attempts", async () => {
    const slugConflict = new OrganizationOperationError(
      "ORGANIZATION_ALREADY_EXISTS",
      "Organization already exists",
    );
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession(null, "jane.doe@example.com"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue(
      [],
    );
    vi.mocked(mockOrganizationManagement.createOrganization).mockRejectedValue(
      slugConflict,
    );

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(slugConflict);
    expect(mockOrganizationManagement.createOrganization).toHaveBeenCalledTimes(
      5,
    );
  });

  it("should not retry when creation fails for another reason", async () => {
    const error = new OrganizationOperationError(
      "ORGANIZATION_CREATION_FORBIDDEN",
      "Organization creation is forbidden",
    );
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession(null, "jane.doe@example.com"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue(
      [],
    );
    vi.mocked(mockOrganizationManagement.createOrganization).mockRejectedValue(
      error,
    );

    const result = await useCase.execute({});

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
    expect(mockOrganizationManagement.createOrganization).toHaveBeenCalledTimes(
      1,
    );
  });

  it("should fall back to a generic slug base when the email has no usable characters", async () => {
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession(null, "+++@example.com"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue(
      [],
    );
    vi.mocked(mockOrganizationManagement.createOrganization).mockResolvedValue(
      buildOrganization({ id: "org-created" }),
    );

    await useCase.execute({});

    expect(mockOrganizationManagement.createOrganization).toHaveBeenCalledWith({
      name: "My Organization",
      slug: "organization-abc123",
    });
  });

  it("should generate a random slug suffix by default", async () => {
    const defaultUseCase = new ResolveActiveOrganizationUseCase(
      mockOrganizationManagement,
      mockAuthProvider,
    );
    vi.mocked(mockAuthProvider.getSession).mockResolvedValue(
      buildSession(null, "jane.doe@example.com"),
    );
    vi.mocked(mockOrganizationManagement.listOrganizations).mockResolvedValue(
      [],
    );
    vi.mocked(mockOrganizationManagement.createOrganization).mockResolvedValue(
      buildOrganization({ id: "org-created" }),
    );

    await defaultUseCase.execute({});

    expect(mockOrganizationManagement.createOrganization).toHaveBeenCalledWith({
      name: "My Organization",
      slug: expect.stringMatching(/^jane-doe-[a-z0-9]+$/),
    });
  });
});

function buildSession(
  activeOrganizationId: string | null,
  email = "jane@example.com",
): AuthSession {
  return {
    user: {
      id: "user-123",
      name: "Jane Doe",
      email,
    },
    session: {
      id: "session-123",
      userId: "user-123",
      expiresAt: new Date("2026-05-01T12:00:00.000Z"),
      activeOrganizationId,
    },
  };
}
