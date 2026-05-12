import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  AdminGetOrganizationDetailsInput,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminOrganizationDetailsDTO } from "../dto/admin-organization-list-item.dto";

type GetAdminOrganizationDetailsOutput = {
  organization: AdminOrganizationDetailsDTO | null;
};

export class GetAdminOrganizationDetailsUseCase implements IUseCase<
  AdminGetOrganizationDetailsInput,
  GetAdminOrganizationDetailsOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(
    input: AdminGetOrganizationDetailsInput,
  ): Promise<Result<GetAdminOrganizationDetailsOutput>> {
    const organization =
      await this.adminRepository.getOrganizationDetails(input);

    return Result.ok({ organization });
  }
}
