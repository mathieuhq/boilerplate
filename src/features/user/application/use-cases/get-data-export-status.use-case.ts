import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  getNextDataExportAt,
  isDataExportExpired,
} from "../../domain/data-export.policy";
import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { DataExportStatusDTO } from "../dto/data-export.dto";
import { toDataExportDTO } from "../services/to-data-export-dto";

type GetDataExportStatusInput = {
  userId: string;
};

export class GetDataExportStatusUseCase implements IUseCase<
  GetDataExportStatusInput,
  DataExportStatusDTO
> {
  constructor(
    private readonly dataExportRepository: IDataExportRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: GetDataExportStatusInput,
  ): Promise<Result<DataExportStatusDTO>> {
    const now = this.now();
    const [latest, latestRequested] = await Promise.all([
      this.dataExportRepository.findLatestByUserId(input.userId, [
        "pending",
        "ready",
        "failed",
      ]),
      this.dataExportRepository.findLatestByUserId(input.userId, [
        "pending",
        "ready",
      ]),
    ]);
    const nextAvailableAt = getNextDataExportAt(latestRequested, now);

    return Result.ok({
      latest:
        latest && !isDataExportExpired(latest, now)
          ? toDataExportDTO(latest)
          : null,
      nextAvailableAt: nextAvailableAt?.toISOString() ?? null,
    });
  }
}
