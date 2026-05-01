import type { Organization } from "../../domain/entities/organization.entity";

export type UpdateOrganizationInput = {
  name?: string;
  slug?: string;
  logo?: string | null;
  organizationId: string;
};

export type IOrganizationManagementPort = {
  updateOrganization: (input: UpdateOrganizationInput) => Promise<Organization>;
  acceptInvitation: (invitationId: string) => Promise<void>;
};
