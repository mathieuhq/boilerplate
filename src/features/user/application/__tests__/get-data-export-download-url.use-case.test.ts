import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataExportExpiredError } from "../../domain/errors/data-export-expired.error";
import { DataExportNotFoundError } from "../../domain/errors/data-export-not-found.error";
import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { IUserAuditLogPort } from "../ports/audit-log.port";
import type { IDataExportStoragePort } from "../ports/data-export-storage.port";
import { GetDataExportDownloadUrlUseCase } from "../use-cases/get-data-export-download-url.use-case";

import {
  buildDataExport,
  createMockAuditLog,
  createMockDataExportRepository,
  createMockDataExportStorage,
  NOW,
} from "./data-export.mocks";

describe("GetDataExportDownloadUrlUseCase", () => {
  let repository: IDataExportRepository;
  let storage: IDataExportStoragePort;
  let auditLog: IUserAuditLogPort;
  let useCase: GetDataExportDownloadUrlUseCase;

  const readyExport = buildDataExport({
    status: "ready",
    fileKey: "data-exports/user-1/export-1.zip",
  });

  beforeEach(() => {
    repository = createMockDataExportRepository();
    storage = createMockDataExportStorage();
    auditLog = createMockAuditLog();
    useCase = new GetDataExportDownloadUrlUseCase(
      repository,
      storage,
      auditLog,
      () => NOW,
    );

    vi.mocked(repository.findById).mockResolvedValue(readyExport);
  });

  it("returns a short-lived presigned URL for the owner", async () => {
    const result = await useCase.execute({
      userId: "user-1",
      exportId: "export-1",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      downloadUrl: "https://s3.example.com/x",
      expiresAt: new Date("2026-11-02T12:05:00.000Z"),
    });
    expect(storage.getDownloadUrl).toHaveBeenCalledWith({
      key: "data-exports/user-1/export-1.zip",
      fileName: "data-export-2026-11-02.zip",
      expiresInSeconds: 300,
    });
    expect(auditLog.record).toHaveBeenCalledWith({
      actorUserId: "user-1",
      action: "user.data_export.downloaded",
      resourceType: "data_export",
      resourceId: "export-1",
    });
  });

  it.each([
    ["does not exist", null],
    ["belongs to another user", { ...readyExport, userId: "user-2" }],
    ["is still pending", { ...readyExport, status: "pending" as const }],
    ["has no file", { ...readyExport, fileKey: null }],
  ])("fails when the export %s", async (_label, dataExport) => {
    vi.mocked(repository.findById).mockResolvedValue(dataExport);

    const result = await useCase.execute({
      userId: "user-1",
      exportId: "export-1",
    });

    expect(result.error).toBeInstanceOf(DataExportNotFoundError);
    expect(storage.getDownloadUrl).not.toHaveBeenCalled();
  });

  it("fails when the export has expired", async () => {
    vi.mocked(repository.findById).mockResolvedValue({
      ...readyExport,
      expiresAt: NOW,
    });

    const result = await useCase.execute({
      userId: "user-1",
      exportId: "export-1",
    });

    expect(result.error).toBeInstanceOf(DataExportExpiredError);
    expect(storage.getDownloadUrl).not.toHaveBeenCalled();
  });

  it("uses the current date by default", async () => {
    vi.mocked(repository.findById).mockResolvedValue({
      ...readyExport,
      expiresAt: new Date("2999-01-01T00:00:00.000Z"),
    });

    const result = await new GetDataExportDownloadUrlUseCase(
      repository,
      storage,
      auditLog,
    ).execute({ userId: "user-1", exportId: "export-1" });

    expect(result.isSuccess).toBe(true);
  });
});
