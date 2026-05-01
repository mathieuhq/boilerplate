import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  type OrganizationInvitationResponseDTO,
  toOrganizationInvitationResponseDTO,
} from "../dto/organization-invitation-response.dto";
import type {
  InviteOrganizationMemberInput,
  IOrganizationManagementPort,
} from "../ports/organization-management.port";

export class InviteOrganizationMemberUseCase implements IUseCase<
  InviteOrganizationMemberInput,
  OrganizationInvitationResponseDTO
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
  ) {}

  async execute(
    input: InviteOrganizationMemberInput,
  ): Promise<Result<OrganizationInvitationResponseDTO>> {
    try {
      const invitation = await this.organizationManagement.inviteMember(input);

      return Result.ok(toOrganizationInvitationResponseDTO(invitation));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
