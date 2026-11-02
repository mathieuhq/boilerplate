import type { UserJobs } from "../../application/jobs/user.jobs";
import type { ExportUserDataUseCase } from "../../application/use-cases/export-user-data.use-case";
import type { GetDataExportDownloadUrlUseCase } from "../../application/use-cases/get-data-export-download-url.use-case";
import type { GetDataExportStatusUseCase } from "../../application/use-cases/get-data-export-status.use-case";
import type { PurgeExpiredDataExportsUseCase } from "../../application/use-cases/purge-expired-data-exports.use-case";
import type { RequestDataExportUseCase } from "../../application/use-cases/request-data-export.use-case";

export class DataExportController {
  constructor(
    private readonly requestDataExportUseCase: RequestDataExportUseCase,
    private readonly exportUserDataUseCase: ExportUserDataUseCase,
    private readonly getDataExportStatusUseCase: GetDataExportStatusUseCase,
    private readonly getDataExportDownloadUrlUseCase: GetDataExportDownloadUrlUseCase,
    private readonly purgeExpiredDataExportsUseCase: PurgeExpiredDataExportsUseCase,
  ) {}

  async requestExport(userId: string) {
    const result = await this.requestDataExportUseCase.execute({ userId });

    return result.unwrap();
  }

  async exportData(payload: UserJobs["user.export-data"]) {
    const result = await this.exportUserDataUseCase.execute(payload);

    return result.unwrap();
  }

  async getStatus(userId: string) {
    const result = await this.getDataExportStatusUseCase.execute({ userId });

    return result.unwrap();
  }

  async getDownloadUrl(userId: string, exportId: string) {
    const result = await this.getDataExportDownloadUrlUseCase.execute({
      userId,
      exportId,
    });

    return result.unwrap();
  }

  async purgeExpired() {
    const result = await this.purgeExpiredDataExportsUseCase.execute({});

    return result.unwrap();
  }
}
