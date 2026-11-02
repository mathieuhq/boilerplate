import {
  describeListQuery,
  iterateListPages,
} from "@/shared/application/list-pages";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import { EXPORT_BATCH_SIZE, MAX_EXPORT_ROWS } from "@/shared/domain/list-query";

import type {
  AdminListOrganizationsInput,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminOrganizationListItemDTO } from "../dto/admin-organization-list-item.dto";

type ExportAdminOrganizationsInput = {
  actorUserId: string;
  query: AdminListOrganizationsInput;
};

type ExportAdminOrganizationsOutput = {
  batches: AsyncIterable<AdminOrganizationListItemDTO[]>;
};

export class ExportAdminOrganizationsUseCase implements IUseCase<
  ExportAdminOrganizationsInput,
  ExportAdminOrganizationsOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(
    input: ExportAdminOrganizationsInput,
  ): Promise<Result<ExportAdminOrganizationsOutput>> {
    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.organizations.exported",
      resourceType: "organization",
      metadata: describeListQuery(input.query),
    });

    const batches = iterateListPages(
      async (page, pageSize) =>
        this.adminRepository.listOrganizations({
          ...input.query,
          page,
          pageSize,
        }),
      { pageSize: EXPORT_BATCH_SIZE, maxRows: MAX_EXPORT_ROWS },
    );

    return Result.ok({ batches });
  }
}
