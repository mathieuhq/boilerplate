import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  CancelOrganizationInvitationInput,
  IOrganizationManagementPort,
} from "../ports/organization-management.port";

type CancelOrganizationInvitationOutput = {
  canceled: true;
};

export class CancelOrganizationInvitationUseCase implements IUseCase<
  CancelOrganizationInvitationInput,
  CancelOrganizationInvitationOutput
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
  ) {}

  async execute(
    input: CancelOrganizationInvitationInput,
  ): Promise<Result<CancelOrganizationInvitationOutput>> {
    try {
      await this.organizationManagement.cancelInvitation(input);

      return Result.ok({ canceled: true });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
