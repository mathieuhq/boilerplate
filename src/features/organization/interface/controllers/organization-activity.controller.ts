import type { ListOrganizationAuditLogsUseCase } from "../../application/use-cases/list-organization-audit-logs.use-case";
import type {
  RecordOrganizationActivityInput,
  RecordOrganizationActivityUseCase,
} from "../../application/use-cases/record-organization-activity.use-case";
import type { ListOrganizationAuditLogsInput } from "../../domain/repositories/organization-audit-log.repository.interface";

export class OrganizationActivityController {
  constructor(
    private readonly recordOrganizationActivityUseCase: RecordOrganizationActivityUseCase,
    private readonly listOrganizationAuditLogsUseCase: ListOrganizationAuditLogsUseCase,
  ) {}

  async record(input: RecordOrganizationActivityInput) {
    const result = await this.recordOrganizationActivityUseCase.execute(input);

    return result.unwrap();
  }

  async listAuditLogs(input: ListOrganizationAuditLogsInput) {
    const result = await this.listOrganizationAuditLogsUseCase.execute(input);

    return result.unwrap();
  }
}
