import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  type OrganizationInvitationResponseDTO,
  toOrganizationInvitationResponseDTO,
} from "../dto/organization-invitation-response.dto";
import type {
  IOrganizationManagementPort,
  ListOrganizationInvitationsInput,
} from "../ports/organization-management.port";

export class ListOrganizationInvitationsUseCase implements IUseCase<
  ListOrganizationInvitationsInput,
  OrganizationInvitationResponseDTO[]
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
  ) {}

  async execute(
    input: ListOrganizationInvitationsInput,
  ): Promise<Result<OrganizationInvitationResponseDTO[]>> {
    try {
      const invitations =
        await this.organizationManagement.listInvitations(input);

      return Result.ok(
        invitations
          .filter((invitation) => invitation.status === "pending")
          .map(toOrganizationInvitationResponseDTO),
      );
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
