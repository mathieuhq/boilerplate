import type { IJobQueuePort } from "@/shared/application/ports/job-queue.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import {
  getDataExportExpiresAt,
  getNextDataExportAt,
} from "../../domain/data-export.policy";
import { DataExportRateLimitedError } from "../../domain/errors/data-export-rate-limited.error";
import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { DataExportDTO } from "../dto/data-export.dto";
import type { UserJobs } from "../jobs/user.jobs";
import type { IUserAuditLogPort } from "../ports/audit-log.port";
import { toDataExportDTO } from "../services/to-data-export-dto";

type RequestDataExportInput = {
  userId: string;
};

export class RequestDataExportUseCase implements IUseCase<
  RequestDataExportInput,
  DataExportDTO
> {
  constructor(
    private readonly dataExportRepository: IDataExportRepository,
    private readonly jobQueue: IJobQueuePort<
      Pick<UserJobs, "user.export-data">
    >,
    private readonly auditLog: IUserAuditLogPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: RequestDataExportInput): Promise<Result<DataExportDTO>> {
    const now = this.now();
    const latest = await this.dataExportRepository.findLatestByUserId(
      input.userId,
      ["pending", "ready"],
    );
    const nextAvailableAt = getNextDataExportAt(latest, now);

    if (nextAvailableAt)
      return Result.fail(new DataExportRateLimitedError(nextAvailableAt));

    const dataExport = await this.dataExportRepository.create({
      userId: input.userId,
      expiresAt: getDataExportExpiresAt(now),
    });

    await this.auditLog.record({
      actorUserId: input.userId,
      action: "user.data_export.requested",
      resourceType: "data_export",
      resourceId: dataExport.id,
    });

    try {
      await this.jobQueue.enqueue(
        { name: "user.export-data", payload: { exportId: dataExport.id } },
        { jobId: `user.export-data-${dataExport.id}` },
      );
    } catch (error) {
      await this.dataExportRepository.markFailed(dataExport.id);

      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    return Result.ok(toDataExportDTO(dataExport));
  }
}
