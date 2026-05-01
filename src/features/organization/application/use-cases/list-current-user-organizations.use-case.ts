import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  type OrganizationResponseDTO,
  toOrganizationResponseDTO,
} from "../dto/organization-response.dto";
import type { IOrganizationManagementPort } from "../ports/organization-management.port";

type ListCurrentUserOrganizationsInput = Record<string, never>;

export class ListCurrentUserOrganizationsUseCase implements IUseCase<
  ListCurrentUserOrganizationsInput,
  OrganizationResponseDTO[]
> {
  constructor(
    private readonly organizationManagement: IOrganizationManagementPort,
  ) {}

  async execute(
    _input: ListCurrentUserOrganizationsInput,
  ): Promise<Result<OrganizationResponseDTO[]>> {
    try {
      const organizations =
        await this.organizationManagement.listOrganizations();

      return Result.ok(organizations.map(toOrganizationResponseDTO));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
