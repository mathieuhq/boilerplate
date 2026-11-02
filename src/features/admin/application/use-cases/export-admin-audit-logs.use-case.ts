import {
  describeListQuery,
  iterateListPages,
} from "@/shared/application/list-pages";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";
import { EXPORT_BATCH_SIZE, MAX_EXPORT_ROWS } from "@/shared/domain/list-query";

import type {
  AdminListAuditLogsInput,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminAuditLogDTO } from "../dto/admin-audit-log.dto";

type ExportAdminAuditLogsInput = {
  actorUserId: string;
  query: AdminListAuditLogsInput;
};

type ExportAdminAuditLogsOutput = {
  batches: AsyncIterable<AdminAuditLogDTO[]>;
};

export class ExportAdminAuditLogsUseCase implements IUseCase<
  ExportAdminAuditLogsInput,
  ExportAdminAuditLogsOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(
    input: ExportAdminAuditLogsInput,
  ): Promise<Result<ExportAdminAuditLogsOutput>> {
    await this.adminRepository.createAuditLog({
      actorType: "user",
      actorUserId: input.actorUserId,
      action: "admin.audit-logs.exported",
      resourceType: "audit-log",
      metadata: describeListQuery(input.query),
    });

    const batches = iterateListPages(
      async (page, pageSize) =>
        this.adminRepository.listAuditLogs({ ...input.query, page, pageSize }),
      { pageSize: EXPORT_BATCH_SIZE, maxRows: MAX_EXPORT_ROWS },
    );

    return Result.ok({ batches });
  }
}
