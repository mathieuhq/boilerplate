import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  IOrganizationManagementPort,
  RemoveOrganizationMemberInput,
} from "../ports/organization-management.port";

type RemoveOrganizationMemberOutput = {
  removed: true;
};

export class RemoveOrganizationMemberUseCase implements IUseCase<
  RemoveOrganizationMemberInput,
  RemoveOrganizationMemberOutput
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
  ) {}

  async execute(
    input: RemoveOrganizationMemberInput,
  ): Promise<Result<RemoveOrganizationMemberOutput>> {
    try {
      await this.organizationManagement.removeMember(input);

      return Result.ok({ removed: true });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
