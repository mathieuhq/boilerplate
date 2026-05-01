import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  type OrganizationMemberResponseDTO,
  toOrganizationMemberResponseDTO,
} from "../dto/organization-member-response.dto";
import { OrganizationOperationError } from "../errors/organization-operation.error";
import type {
  IOrganizationManagementPort,
  ListOrganizationMembersInput,
  MemberRole,
  OrganizationMember,
} from "../ports/organization-management.port";

export class ListOrganizationMembersUseCase implements IUseCase<
  ListOrganizationMembersInput,
  OrganizationMemberResponseDTO[]
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
    private readonly authProvider: IAuthProviderPort,
  ) {}

  async execute(
    input: ListOrganizationMembersInput,
  ): Promise<Result<OrganizationMemberResponseDTO[]>> {
    try {
      const session = await this.authProvider.getSession();

      if (!session) {
        await this.authProvider.getRequiredUser();

        return Result.fail(
          new OrganizationOperationError(
            "ORGANIZATION_SESSION_REQUIRED",
            "A session is required to list organization members",
          ),
        );
      }

      const members = await this.organizationManagement.listMembers(input);

      const currentUserId = session.user.id;

      const currentMember = members.find(
        (member) => member.userId === currentUserId,
      );

      const ownerCount = members.filter(
        (member) => member.role === "owner",
      ).length;

      return Result.ok(
        members.map((member) =>
          toOrganizationMemberResponseDTO(member, {
            isCurrentUser: member.userId === currentUserId,
            canRemove: canRemoveMember({
              member,
              ownerCount,
              currentUserId,
              currentUserRole: currentMember?.role,
            }),
          }),
        ),
      );
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}

function canRemoveMember(input: {
  ownerCount: number;
  currentUserId: string;
  member: OrganizationMember;
  currentUserRole?: MemberRole;
}) {
  if (input.member.userId === input.currentUserId) return false;

  if (input.currentUserRole === "owner") {
    if (input.member.role !== "owner") return true;

    return input.ownerCount > 1;
  }

  if (input.currentUserRole === "admin") return input.member.role !== "owner";

  return false;
}
