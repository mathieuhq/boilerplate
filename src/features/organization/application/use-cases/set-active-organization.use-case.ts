import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  type OrganizationResponseDTO,
  toOrganizationResponseDTO,
} from "../dto/organization-response.dto";
import type {
  IOrganizationManagementPort,
  SetActiveOrganizationInput,
} from "../ports/organization-management.port";

export class SetActiveOrganizationUseCase implements IUseCase<
  SetActiveOrganizationInput,
  OrganizationResponseDTO
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
  ) {}

  async execute(
    input: SetActiveOrganizationInput,
  ): Promise<Result<OrganizationResponseDTO>> {
    try {
      const organization =
        await this.organizationManagement.setActiveOrganization(input);

      return Result.ok(toOrganizationResponseDTO(organization));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
