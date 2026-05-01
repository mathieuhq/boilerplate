import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IOrganizationManagementPort } from "../ports/organization-management.port";

type AcceptOrganizationInvitationInput = {
  invitationId: string;
};

export type AcceptOrganizationInvitationOutput = {
  accepted: true;
};

export class AcceptOrganizationInvitationUseCase implements IUseCase<
  AcceptOrganizationInvitationInput,
  AcceptOrganizationInvitationOutput
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
  ) {}

  async execute(
    input: AcceptOrganizationInvitationInput,
  ): Promise<Result<AcceptOrganizationInvitationOutput>> {
    try {
      await this.organizationManagement.acceptInvitation(input.invitationId);

      return Result.ok({ accepted: true });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
