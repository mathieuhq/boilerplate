import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { IDataExportStoragePort } from "../ports/data-export-storage.port";

const PURGE_BATCH_SIZE = 100;

type PurgeExpiredDataExportsInput = Record<string, never>;

type PurgeExpiredDataExportsOutput = {
  deleted: number;
  failed: number;
};

export class PurgeExpiredDataExportsUseCase implements IUseCase<
  PurgeExpiredDataExportsInput,
  PurgeExpiredDataExportsOutput
> {
  constructor(
    private readonly dataExportRepository: IDataExportRepository,
    private readonly storage: IDataExportStoragePort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    _input: PurgeExpiredDataExportsInput,
  ): Promise<Result<PurgeExpiredDataExportsOutput>> {
    const failedIds = new Set<string>();
    const deleted = await this.purgeBatches(this.now(), failedIds);

    return Result.ok({ deleted, failed: failedIds.size });
  }

  private async purgeBatches(
    now: Date,
    failedIds: Set<string>,
  ): Promise<number> {
    const expired = (
      await this.dataExportRepository.findExpired(now, PURGE_BATCH_SIZE)
    ).filter((dataExport) => !failedIds.has(dataExport.id));

    if (expired.length === 0) return 0;

    const results = await Promise.allSettled(
      expired.map(async (dataExport) => {
        if (dataExport.fileKey) await this.storage.delete(dataExport.fileKey);

        return dataExport.id;
      }),
    );

    const removableIds = results.flatMap((result, index) => {
      if (result.status === "fulfilled") return [result.value];

      failedIds.add(expired[index].id);

      return [];
    });

    const deleted =
      removableIds.length > 0
        ? await this.dataExportRepository.deleteMany(removableIds)
        : 0;

    return deleted + (await this.purgeBatches(now, failedIds));
  }
}
