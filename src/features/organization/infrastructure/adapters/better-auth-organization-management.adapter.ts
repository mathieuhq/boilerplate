import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import { OrganizationOperationError } from "../../application/errors/organization-operation.error";
import type {
  CancelOrganizationInvitationInput,
  CreateOrganizationInput,
  InviteOrganizationMemberInput,
  IOrganizationManagementPort,
  ListOrganizationInvitationsInput,
  ListOrganizationMembersInput,
  MemberRole,
  OrganizationInvitation,
  OrganizationMember,
  RemoveOrganizationMemberInput,
  SetActiveOrganizationInput,
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

type BetterAuthInvitation = {
  id: string;
  role: string;
  email: string;
  status: string;
  organizationId: string;
  expiresAt: Date | string;
  createdAt: Date | string;
};

type BetterAuthMember = {
  id: string;
  role: string;
  userId: string;
  organizationId: string;
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export class BetterAuthOrganizationManagementAdapter implements IOrganizationManagementPort {
  async listOrganizations(): Promise<Organization[]> {
    try {
      const organizations = await auth.api.listOrganizations({
        headers: await headers(),
      });

      return organizations.map((organization) => this.toDomain(organization));
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  async createOrganization(
    input: CreateOrganizationInput,
  ): Promise<Organization> {
    try {
      const organization = await auth.api.createOrganization({
        body: {
          name: input.name,
          slug: input.slug,
        },
        headers: await headers(),
      });

      return this.toDomain(organization);
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  async setActiveOrganization(
    input: SetActiveOrganizationInput,
  ): Promise<Organization> {
    try {
      const organization = await auth.api.setActiveOrganization({
        body: {
          organizationId: input.organizationId,
        },
        headers: await headers(),
      });

      if (!organization)
        throw new OrganizationOperationError(
          "ORGANIZATION_SET_ACTIVE_FAILED",
          "Active organization update failed",
        );

      return this.toDomain(organization);
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  async listMembers(
    input: ListOrganizationMembersInput,
  ): Promise<OrganizationMember[]> {
    try {
      const response = await auth.api.listMembers({
        query: {
          organizationId: input.organizationId,
        },
        headers: await headers(),
      });

      return response.members.map((member) => this.toMember(member));
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  async removeMember(input: RemoveOrganizationMemberInput): Promise<void> {
    try {
      await auth.api.removeMember({
        body: {
          organizationId: input.organizationId,
          memberIdOrEmail: input.memberId,
        },
        headers: await headers(),
      });
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  async listInvitations(
    input: ListOrganizationInvitationsInput,
  ): Promise<OrganizationInvitation[]> {
    try {
      const invitations = await auth.api.listInvitations({
        query: {
          organizationId: input.organizationId,
        },
        headers: await headers(),
      });

      return invitations.map((invitation) => this.toInvitation(invitation));
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  async cancelInvitation(
    input: CancelOrganizationInvitationInput,
  ): Promise<void> {
    try {
      await auth.api.cancelInvitation({
        body: {
          invitationId: input.invitationId,
        },
        headers: await headers(),
      });
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

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

  async inviteMember(
    input: InviteOrganizationMemberInput,
  ): Promise<OrganizationInvitation> {
    try {
      const invitation = await auth.api.createInvitation({
        body: {
          email: input.email,
          role: input.role,
          organizationId: input.organizationId,
        },
        headers: await headers(),
      });

      return this.toInvitation(invitation);
    } catch (error) {
      throw this.toOrganizationError(error);
    }
  }

  private toDomain(raw: BetterAuthOrganization): Organization {
    let logo = raw.logo ?? undefined;
    if (logo === "") logo = undefined;

    return Organization.create({
      logo,
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
    });
  }

  private toInvitation(raw: BetterAuthInvitation): OrganizationInvitation {
    return {
      id: raw.id,
      email: raw.email,
      status: raw.status,
      organizationId: raw.organizationId,
      role: raw.role === "admin" ? "admin" : "member",
      expiresAt:
        raw.expiresAt instanceof Date ? raw.expiresAt : new Date(raw.expiresAt),
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt),
    };
  }

  private toMember(raw: BetterAuthMember): OrganizationMember {
    return {
      id: raw.id,
      userId: raw.userId,
      role: this.toMemberRole(raw.role),
      organizationId: raw.organizationId,
      createdAt:
        raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt),
      user: {
        id: raw.user.id,
        name: raw.user.name,
        email: raw.user.email,
        image: raw.user.image ?? null,
      },
    };
  }

  private toMemberRole(role: string): MemberRole {
    const roles = role.split(",").map((value) => value.trim());

    if (roles.includes("owner")) return "owner";
    if (roles.includes("admin")) return "admin";

    return "member";
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
