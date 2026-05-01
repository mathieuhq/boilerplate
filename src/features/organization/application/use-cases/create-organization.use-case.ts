import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  type OrganizationResponseDTO,
  toOrganizationResponseDTO,
} from "../dto/organization-response.dto";
import type {
  CreateOrganizationInput,
  IOrganizationManagementPort,
} from "../ports/organization-management.port";

export class CreateOrganizationUseCase implements IUseCase<
  CreateOrganizationInput,
  OrganizationResponseDTO
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
  ) {}

  async execute(
    input: CreateOrganizationInput,
  ): Promise<Result<OrganizationResponseDTO>> {
    try {
      const organization =
        await this.organizationManagement.createOrganization(input);

      return Result.ok(toOrganizationResponseDTO(organization));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
