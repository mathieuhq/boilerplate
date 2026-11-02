import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IJobQueuePort } from "@/shared/application/ports/job-queue.port";

import { DataExportRateLimitedError } from "../../domain/errors/data-export-rate-limited.error";
import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { UserJobs } from "../jobs/user.jobs";
import type { IUserAuditLogPort } from "../ports/audit-log.port";
import { RequestDataExportUseCase } from "../use-cases/request-data-export.use-case";

import {
  buildDataExport,
  createMockAuditLog,
  createMockDataExportRepository,
  NOW,
} from "./data-export.mocks";

describe("RequestDataExportUseCase", () => {
  let repository: IDataExportRepository;
  let jobQueue: IJobQueuePort<Pick<UserJobs, "user.export-data">>;
  let auditLog: IUserAuditLogPort;
  let useCase: RequestDataExportUseCase;

  beforeEach(() => {
    repository = createMockDataExportRepository();
    jobQueue = { enqueue: vi.fn().mockResolvedValue(undefined) };
    auditLog = createMockAuditLog();
    useCase = new RequestDataExportUseCase(
      repository,
      jobQueue,
      auditLog,
      () => NOW,
    );

    vi.mocked(repository.findLatestByUserId).mockResolvedValue(null);
    vi.mocked(repository.create).mockResolvedValue(
      buildDataExport({ id: "export-2", createdAt: NOW }),
    );
  });

  it("creates the export, records the audit log and queues the job", async () => {
    const result = await useCase.execute({ userId: "user-1" });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      id: "export-2",
      status: "pending",
      createdAt: NOW.toISOString(),
      expiresAt: "2026-11-09T10:00:00.000Z",
    });
    expect(repository.findLatestByUserId).toHaveBeenCalledWith("user-1", [
      "pending",
      "ready",
    ]);
    expect(repository.create).toHaveBeenCalledWith({
      userId: "user-1",
      expiresAt: new Date("2026-11-09T12:00:00.000Z"),
    });
    expect(auditLog.record).toHaveBeenCalledWith({
      actorUserId: "user-1",
      action: "user.data_export.requested",
      resourceType: "data_export",
      resourceId: "export-2",
    });
    expect(jobQueue.enqueue).toHaveBeenCalledWith(
      { name: "user.export-data", payload: { exportId: "export-2" } },
      { jobId: "user.export-data-export-2" },
    );
  });

  it("refuses a second export within 24 hours", async () => {
    vi.mocked(repository.findLatestByUserId).mockResolvedValue(
      buildDataExport({
        status: "ready",
        createdAt: new Date("2026-11-02T10:00:00.000Z"),
      }),
    );

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(DataExportRateLimitedError);
    expect(
      (result.error as DataExportRateLimitedError).nextAvailableAt,
    ).toEqual(new Date("2026-11-03T10:00:00.000Z"));
    expect(repository.create).not.toHaveBeenCalled();
    expect(auditLog.record).not.toHaveBeenCalled();
    expect(jobQueue.enqueue).not.toHaveBeenCalled();
  });

  it("marks the export as failed when the job cannot be queued", async () => {
    const error = new Error("Redis unavailable");
    vi.mocked(jobQueue.enqueue).mockRejectedValue(error);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
    expect(repository.markFailed).toHaveBeenCalledWith("export-2");
  });

  it("wraps non-Error queue failures", async () => {
    vi.mocked(jobQueue.enqueue).mockRejectedValue("boom");

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.error.message).toBe("boom");
  });

  it("uses the current date by default", async () => {
    const defaultUseCase = new RequestDataExportUseCase(
      repository,
      jobQueue,
      auditLog,
    );

    const result = await defaultUseCase.execute({ userId: "user-1" });

    expect(result.isSuccess).toBe(true);
  });
});
