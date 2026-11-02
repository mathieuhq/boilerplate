import {
  describeListQuery,
  iterateListPages,
} from "@/shared/application/list-pages";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import { EXPORT_BATCH_SIZE, MAX_EXPORT_ROWS } from "@/shared/domain/list-query";

import type {
  AdminListUsersInput,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminUserListItemDTO } from "../dto/admin-user-list-item.dto";

type ExportAdminUsersInput = {
  actorUserId: string;
  query: AdminListUsersInput;
};

type ExportAdminUsersOutput = {
  batches: AsyncIterable<AdminUserListItemDTO[]>;
};

export class ExportAdminUsersUseCase implements IUseCase<
  ExportAdminUsersInput,
  ExportAdminUsersOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(
    input: ExportAdminUsersInput,
  ): Promise<Result<ExportAdminUsersOutput>> {
    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.users.exported",
      resourceType: "user",
      metadata: describeListQuery(input.query),
    });

    const batches = iterateListPages(
      async (page, pageSize) =>
        this.adminRepository.listUsers({ ...input.query, page, pageSize }),
      { pageSize: EXPORT_BATCH_SIZE, maxRows: MAX_EXPORT_ROWS },
    );

    return Result.ok({ batches });
  }
}
