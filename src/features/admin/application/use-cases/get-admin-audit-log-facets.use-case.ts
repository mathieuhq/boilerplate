import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";
import type { AdminAuditLogFacetsDTO } from "../dto/admin-audit-log.dto";

type GetAdminAuditLogFacetsOutput = {
  facets: AdminAuditLogFacetsDTO;
};

export class GetAdminAuditLogFacetsUseCase implements IUseCase<
  void,
  GetAdminAuditLogFacetsOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(): Promise<Result<GetAdminAuditLogFacetsOutput>> {
    const facets = await this.adminRepository.getAuditLogFacets();

    return Result.ok({ facets });
  }
}
