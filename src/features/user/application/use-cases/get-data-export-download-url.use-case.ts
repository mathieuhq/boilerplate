import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  DATA_EXPORT_DOWNLOAD_URL_TTL_SECONDS,
  getDataExportFileName,
  isDataExportExpired,
} from "../../domain/data-export.policy";
import { DataExportExpiredError } from "../../domain/errors/data-export-expired.error";
import { DataExportNotFoundError } from "../../domain/errors/data-export-not-found.error";
import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { IUserAuditLogPort } from "../ports/audit-log.port";
import type { IDataExportStoragePort } from "../ports/data-export-storage.port";

type GetDataExportDownloadUrlInput = {
  userId: string;
  exportId: string;
};

type GetDataExportDownloadUrlOutput = {
  downloadUrl: string;
  expiresAt: Date;
};

export class GetDataExportDownloadUrlUseCase implements IUseCase<
  GetDataExportDownloadUrlInput,
  GetDataExportDownloadUrlOutput
> {
  constructor(
    private readonly dataExportRepository: IDataExportRepository,
    private readonly storage: IDataExportStoragePort,
    private readonly auditLog: IUserAuditLogPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: GetDataExportDownloadUrlInput,
  ): Promise<Result<GetDataExportDownloadUrlOutput>> {
    const dataExport = await this.dataExportRepository.findById(input.exportId);

    if (
      !dataExport ||
      dataExport.userId !== input.userId ||
      dataExport.status !== "ready" ||
      !dataExport.fileKey
    )
      return Result.fail(new DataExportNotFoundError(input.exportId));

    const now = this.now();

    if (isDataExportExpired(dataExport, now))
      return Result.fail(new DataExportExpiredError(input.exportId));

    const downloadUrl = await this.storage.getDownloadUrl({
      key: dataExport.fileKey,
      fileName: getDataExportFileName(dataExport.createdAt),
      expiresInSeconds: DATA_EXPORT_DOWNLOAD_URL_TTL_SECONDS,
    });

    await this.auditLog.record({
      actorUserId: input.userId,
      action: "user.data_export.downloaded",
      resourceType: "data_export",
      resourceId: dataExport.id,
    });

    return Result.ok({
      downloadUrl,
      expiresAt: new Date(
        now.getTime() + DATA_EXPORT_DOWNLOAD_URL_TTL_SECONDS * 1000,
      ),
    });
  }
}
