import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  AdminListAuditLogsInput,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import type { AdminAuditLogListDTO } from "../dto/admin-audit-log.dto";

type ListAdminAuditLogsOutput = {
  auditLogs: AdminAuditLogListDTO;
};

export class ListAdminAuditLogsUseCase implements IUseCase<
  AdminListAuditLogsInput,
  ListAdminAuditLogsOutput
> {
  constructor(private readonly adminRepository: IAdminRepository) {}

  async execute(
    input: AdminListAuditLogsInput,
  ): Promise<Result<ListAdminAuditLogsOutput>> {
    const auditLogs = await this.adminRepository.listAuditLogs(input);

    return Result.ok({ auditLogs });
  }
}
