import type { OrganizationInvitation } from "../ports/organization-management.port";

export type OrganizationInvitationResponseDTO = {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  organizationId: string;
  role: OrganizationInvitation["role"];
};

export function toOrganizationInvitationResponseDTO(
  invitation: OrganizationInvitation,
): OrganizationInvitationResponseDTO {
  return {
    id: invitation.id,
    role: invitation.role,
    email: invitation.email,
    status: invitation.status,
    organizationId: invitation.organizationId,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
  };
}
