import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  AdminListOrganizationsInput,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminOrganizationListDTO } from "../dto/admin-organization-list-item.dto";

type ListAdminOrganizationsOutput = {
  organizations: AdminOrganizationListDTO;
};

export class ListAdminOrganizationsUseCase implements IUseCase<
  AdminListOrganizationsInput,
  ListAdminOrganizationsOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(
    input: AdminListOrganizationsInput,
  ): Promise<Result<ListAdminOrganizationsOutput>> {
    const organizations = await this.adminRepository.listOrganizations(input);

    return Result.ok({ organizations });
  }
}
