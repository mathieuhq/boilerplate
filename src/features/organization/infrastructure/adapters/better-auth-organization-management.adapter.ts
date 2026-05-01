import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { OrganizationOperationError } from "../../application/errors/organization-operation.error";
import type {
  IOrganizationManagementPort,
  UpdateOrganizationInput,
} from "../../application/ports/organization-management.port";
import { Organization } from "../../domain/entities/organization.entity";

type BetterAuthErrorBody = {
  code?: string;
  message?: string;
};

type BetterAuthApiError = Error & {
  statusCode?: number;
  body?: BetterAuthErrorBody;
};

type BetterAuthOrganization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export class BetterAuthOrganizationManagementAdapter
  implements IOrganizationManagementPort
{
  async updateOrganization(
    input: UpdateOrganizationInput,
  ): Promise<Organization> {
    try {
      const data = {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.slug !== undefined && { slug: input.slug }),
        ...(input.logo !== undefined && { logo: input.logo ?? "" }),
      };

      const organization = await auth.api.updateOrganization({
        body: {
          data,
          organizationId: input.organizationId,
        },
        headers: await headers(),
      });

      if (!organization)
        throw new OrganizationOperationError(
          "ORGANIZATION_UPDATE_FAILED",
          "Organization update failed",
        );

      return this.toDomain(organization);
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    try {
      await auth.api.acceptInvitation({
        body: {
          invitationId,
        },
        headers: await headers(),
      });
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  private toDomain(raw: BetterAuthOrganization): Organization {
    let logo = raw.logo ?? undefined;
    if (logo === "") logo = undefined;

    return Organization.create({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      logo,
    });
  }

  private toOrganizationError(error: unknown): OrganizationOperationError {
    const apiError = error as Partial<BetterAuthApiError>;

    return new OrganizationOperationError(
      apiError.body?.code ?? "ORGANIZATION_OPERATION_FAILED",
      apiError.body?.message ??
        (error instanceof Error
          ? error.message
          : "Organization operation failed"),
    );
  }
}
