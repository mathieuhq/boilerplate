import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { OrganizationAccessDeniedError } from "../../domain/errors/organization-access-denied.error";
import type { IOrganizationRepository } from "../../domain/repositories/organization.repository.interface";
import {
  type OrganizationResponseDTO,
  toOrganizationResponseDTO,
} from "../dto/organization-response.dto";

type GetCurrentUserOrganizationInput = Record<string, never>;

export class GetCurrentUserOrganizationUseCase implements IUseCase<
  GetCurrentUserOrganizationInput,
  OrganizationResponseDTO
> {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly authProvider: IAuthProviderPort,
  ) {}

  async execute(
    _input: GetCurrentUserOrganizationInput,
  ): Promise<Result<OrganizationResponseDTO>> {
    const authUser = await this.authProvider.getRequiredUser();

    const organization =
      await this.organizationRepository.findByUserIdWithAdminRole(authUser.id);

    if (!organization) {
      return Result.fail(new OrganizationAccessDeniedError());
    }

    return Result.ok(toOrganizationResponseDTO(organization));
  }
}
