import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { Organization } from "../../domain/entities/organization.entity";
import {
  type OrganizationResponseDTO,
  toOrganizationResponseDTO,
} from "../dto/organization-response.dto";
import { OrganizationOperationError } from "../errors/organization-operation.error";
import type { IOrganizationManagementPort } from "../ports/organization-management.port";

const DEFAULT_ORGANIZATION_NAME = "My Organization";
const MAX_DEFAULT_ORGANIZATION_CREATE_ATTEMPTS = 5;

type ResolveActiveOrganizationInput = Record<string, never>;

export type ResolvedActiveOrganizationDTO = {
  activeOrganizationId: string;
  organizations: OrganizationResponseDTO[];
};

type SlugSuffixGenerator = () => string;

export class ResolveActiveOrganizationUseCase implements IUseCase<
  ResolveActiveOrganizationInput,
  ResolvedActiveOrganizationDTO
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
    private readonly authProvider: IAuthProviderPort,
    private readonly slugSuffixGenerator: SlugSuffixGenerator = createRandomSlugSuffix,
  ) {}

  async execute(
    _input: ResolveActiveOrganizationInput,
  ): Promise<Result<ResolvedActiveOrganizationDTO>> {
    try {
      const session = await this.authProvider.getSession();

      if (!session) {
        await this.authProvider.getRequiredUser();

        return Result.fail(
          new OrganizationOperationError(
            "ORGANIZATION_SESSION_REQUIRED",
            "A session is required to resolve the active organization",
          ),
        );
      }

      const organizations =
        await this.organizationManagement.listOrganizations();

      const activeOrganization = organizations.find(
        (organization) =>
          organization.id === session.session.activeOrganizationId,
      );

      if (activeOrganization)
        return Result.ok({
          organizations: organizations.map(toOrganizationResponseDTO),
          activeOrganizationId: activeOrganization.id,
        });

      if (organizations.length > 0) {
        const firstOrganization = organizations[0];

        const nextActiveOrganization =
          await this.organizationManagement.setActiveOrganization({
            organizationId: firstOrganization.id,
          });

        return Result.ok({
          organizations: organizations.map(toOrganizationResponseDTO),
          activeOrganizationId: nextActiveOrganization.id,
        });
      }

      const defaultOrganization = await this.createDefaultOrganization(
        session.user.email,
      );

      return Result.ok({
        organizations: [toOrganizationResponseDTO(defaultOrganization)],
        activeOrganizationId: defaultOrganization.id,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private async createDefaultOrganization(
    email: string,
  ): Promise<Organization> {
    const slugBase = getEmailSlugBase(email);

    return this.createDefaultOrganizationWithAttempt(slugBase, 0);
  }

  private async createDefaultOrganizationWithAttempt(
    slugBase: string,
    attempt: number,
  ): Promise<Organization> {
    const slug = createDefaultOrganizationSlug(
      slugBase,
      this.slugSuffixGenerator(),
    );

    try {
      return await this.organizationManagement.createOrganization({
        name: DEFAULT_ORGANIZATION_NAME,
        slug,
      });
    } catch (error) {
      const nextAttempt = attempt + 1;

      if (
        !isSlugConflictError(error) ||
        nextAttempt >= MAX_DEFAULT_ORGANIZATION_CREATE_ATTEMPTS
      )
        throw error;

      return this.createDefaultOrganizationWithAttempt(slugBase, nextAttempt);
    }
  }
}

function createRandomSlugSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

function getEmailSlugBase(email: string) {
  return slugify(email.split("@")[0] ?? "organization");
}

function createDefaultOrganizationSlug(base: string, suffix: string) {
  const normalizedSuffix = slugify(suffix).slice(0, 12) || "default";
  const maxBaseLength = 50 - normalizedSuffix.length - 1;
  const normalizedBase =
    base.slice(0, Math.max(1, maxBaseLength)).replace(/-+$/g, "") ||
    "organization";

  return `${normalizedBase}-${normalizedSuffix}`;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "organization"
  );
}

function isSlugConflictError(error: unknown) {
  return (
    error instanceof OrganizationOperationError &&
    (error.code === "ORGANIZATION_ALREADY_EXISTS" ||
      error.code === "ORGANIZATION_SLUG_ALREADY_TAKEN")
  );
}
