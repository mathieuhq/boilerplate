import type {
  MemberRole,
  OrganizationMember,
} from "../ports/organization-management.port";

export type OrganizationMemberResponseDTO = {
  id: string;
  userId: string;
  role: MemberRole;
  status: "active";
  createdAt: string;
  canRemove: boolean;
  organizationId: string;
  isCurrentUser: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export function toOrganizationMemberResponseDTO(
  member: OrganizationMember,
  options: {
    canRemove: boolean;
    isCurrentUser: boolean;
  },
): OrganizationMemberResponseDTO {
  return {
    id: member.id,
    status: "active",
    role: member.role,
    userId: member.userId,
    canRemove: options.canRemove,
    isCurrentUser: options.isCurrentUser,
    organizationId: member.organizationId,
    createdAt: member.createdAt.toISOString(),
    user: {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image ?? null,
    },
  };
}
