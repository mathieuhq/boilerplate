import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  getDataExportExpiresAt,
  getDataExportFileKey,
  isDataExportExpired,
} from "../../domain/data-export.policy";
import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { UserDataSnapshot } from "../dto/user-data-snapshot.dto";
import type { UserJobs } from "../jobs/user.jobs";
import type { IArchivePort } from "../ports/archive.port";
import type { IDataExportNotifierPort } from "../ports/data-export-notifier.port";
import type { IDataExportReadmePort } from "../ports/data-export-readme.port";
import type { IDataExportStoragePort } from "../ports/data-export-storage.port";
import type { IUserDataCollectorPort } from "../ports/user-data-collector.port";
import {
  buildDataExportFiles,
  type DataExportAttachment,
} from "../services/build-data-export-files";

type ExportUserDataOutput =
  | { status: "ready"; fileKey: string; size: number }
  | { status: "skipped" };

export class ExportUserDataUseCase implements IUseCase<
  UserJobs["user.export-data"],
  ExportUserDataOutput
> {
  constructor(
    private readonly dataExportRepository: IDataExportRepository,
    private readonly collector: IUserDataCollectorPort,
    private readonly storage: IDataExportStoragePort,
    private readonly archive: IArchivePort,
    private readonly readme: IDataExportReadmePort,
    private readonly notifier: IDataExportNotifierPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: UserJobs["user.export-data"],
  ): Promise<Result<ExportUserDataOutput>> {
    const dataExport = await this.dataExportRepository.findById(input.exportId);

    if (
      !dataExport?.userId ||
      dataExport.status === "ready" ||
      isDataExportExpired(dataExport, this.now())
    )
      return Result.ok({ status: "skipped" });

    const userId = dataExport.userId;

    try {
      const snapshot = await this.collector.collect(userId);

      if (!snapshot) {
        await this.dataExportRepository.markFailed(dataExport.id);

        return Result.ok({ status: "skipped" });
      }

      const generatedAt = this.now();
      const expiresAt = getDataExportExpiresAt(generatedAt);
      const files = buildDataExportFiles(
        snapshot,
        await this.downloadStoredFiles(snapshot.storedFiles),
      );
      const readme = this.readme.render({
        language: snapshot.profile.language,
        generatedAt,
        expiresAt,
        files: files.map((file) => file.path),
      });
      const archive = await this.archive.create([
        { path: "README.md", content: readme },
        ...files,
      ]);
      const fileKey = getDataExportFileKey(userId, dataExport.id);

      await this.storage.upload({
        key: fileKey,
        body: Buffer.from(archive),
        contentType: "application/zip",
      });

      await this.dataExportRepository.markReady(dataExport.id, {
        fileKey,
        size: archive.byteLength,
        completedAt: generatedAt,
        expiresAt,
      });

      await this.notifier.notifyReady({
        exportId: dataExport.id,
        userId,
        email: snapshot.profile.email,
        name: snapshot.profile.name,
        language: snapshot.profile.language,
        expiresAt,
      });

      return Result.ok({ status: "ready", fileKey, size: archive.byteLength });
    } catch (error) {
      await this.dataExportRepository.markFailed(dataExport.id);

      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private async downloadStoredFiles(
    storedFiles: UserDataSnapshot["storedFiles"],
  ): Promise<DataExportAttachment[]> {
    return Promise.all(
      storedFiles.map(async (file) => ({
        key: file.key,
        purpose: file.purpose,
        content: await this.storage.download(file.key),
      })),
    );
  }
}
