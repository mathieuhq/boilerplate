import type {
  MemberRole,
  Organization,
} from "../../domain/entities/organization.entity";

export type { MemberRole };

type OrganizationInviteRole = Extract<MemberRole, "admin" | "member">;

export type UpdateOrganizationInput = {
  name?: string;
  slug?: string;
  logo?: string | null;
  organizationId: string;
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
};

export type SetActiveOrganizationInput = {
  organizationId: string;
};

export type ListOrganizationMembersInput = {
  organizationId: string;
};

export type RemoveOrganizationMemberInput = {
  memberId: string;
  organizationId: string;
};

export type ListOrganizationInvitationsInput = {
  organizationId: string;
};

export type CancelOrganizationInvitationInput = {
  invitationId: string;
};

export type InviteOrganizationMemberInput = {
  email: string;
  organizationId: string;
  role: OrganizationInviteRole;
};

export type OrganizationMember = {
  id: string;
  userId: string;
  createdAt: Date;
  role: MemberRole;
  organizationId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export type OrganizationInvitation = {
  id: string;
  email: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
  organizationId: string;
  role: OrganizationInviteRole;
};

export type IOrganizationManagementPort = {
  listOrganizations: () => Promise<Organization[]>;
  createOrganization: (input: CreateOrganizationInput) => Promise<Organization>;
  setActiveOrganization: (
    input: SetActiveOrganizationInput,
  ) => Promise<Organization>;
  listMembers: (
    input: ListOrganizationMembersInput,
  ) => Promise<OrganizationMember[]>;
  removeMember: (input: RemoveOrganizationMemberInput) => Promise<void>;
  listInvitations: (
    input: ListOrganizationInvitationsInput,
  ) => Promise<OrganizationInvitation[]>;
  cancelInvitation: (input: CancelOrganizationInvitationInput) => Promise<void>;
  updateOrganization: (input: UpdateOrganizationInput) => Promise<Organization>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  inviteMember: (
    input: InviteOrganizationMemberInput,
  ) => Promise<OrganizationInvitation>;
};
