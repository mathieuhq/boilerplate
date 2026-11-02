import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { IArchivePort } from "../ports/archive.port";
import type { IDataExportNotifierPort } from "../ports/data-export-notifier.port";
import type { IDataExportReadmePort } from "../ports/data-export-readme.port";
import type { IDataExportStoragePort } from "../ports/data-export-storage.port";
import type { IUserDataCollectorPort } from "../ports/user-data-collector.port";
import { ExportUserDataUseCase } from "../use-cases/export-user-data.use-case";

import {
  buildDataExport,
  buildSnapshot,
  createMockDataExportRepository,
  createMockDataExportStorage,
  NOW,
} from "./data-export.mocks";

describe("ExportUserDataUseCase", () => {
  let repository: IDataExportRepository;
  let collector: IUserDataCollectorPort;
  let storage: IDataExportStoragePort;
  let archive: IArchivePort;
  let readme: IDataExportReadmePort;
  let notifier: IDataExportNotifierPort;
  let useCase: ExportUserDataUseCase;

  const archiveBytes = new Uint8Array([80, 75, 3, 4]);

  beforeEach(() => {
    repository = createMockDataExportRepository();
    collector = { collect: vi.fn().mockResolvedValue(buildSnapshot()) };
    storage = createMockDataExportStorage();
    archive = { create: vi.fn().mockResolvedValue(archiveBytes) };
    readme = { render: vi.fn().mockReturnValue("# README") };
    notifier = { notifyReady: vi.fn().mockResolvedValue(undefined) };
    useCase = new ExportUserDataUseCase(
      repository,
      collector,
      storage,
      archive,
      readme,
      notifier,
      () => NOW,
    );

    vi.mocked(repository.findById).mockResolvedValue(buildDataExport());
    vi.mocked(storage.download).mockResolvedValue(Buffer.from("avatar"));
  });

  it("builds the archive, uploads it, marks the export ready and notifies the user", async () => {
    const result = await useCase.execute({ exportId: "export-1" });
    const expiresAt = new Date("2026-11-09T12:00:00.000Z");

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual({
      status: "ready",
      fileKey: "data-exports/user-1/export-1.zip",
      size: 4,
    });
    expect(collector.collect).toHaveBeenCalledWith("user-1");
    expect(storage.download).toHaveBeenCalledWith("user-avatars/avatar-1.webp");

    const files = vi.mocked(archive.create).mock.calls[0][0];
    const paths = files.map((file) => file.path);

    expect(paths[0]).toBe("README.md");
    expect(files[0].content).toBe("# README");
    expect(paths).toContain("profile.json");
    expect(paths).toContain("files/avatar-avatar-1.webp");
    expect(readme.render).toHaveBeenCalledWith({
      language: "FR",
      generatedAt: NOW,
      expiresAt,
      files: paths.slice(1),
    });
    expect(storage.upload).toHaveBeenCalledWith({
      key: "data-exports/user-1/export-1.zip",
      body: Buffer.from(archiveBytes),
      contentType: "application/zip",
    });
    expect(repository.markReady).toHaveBeenCalledWith("export-1", {
      fileKey: "data-exports/user-1/export-1.zip",
      size: 4,
      completedAt: NOW,
      expiresAt,
    });
    expect(notifier.notifyReady).toHaveBeenCalledWith({
      exportId: "export-1",
      userId: "user-1",
      email: "ada@example.com",
      name: "Ada Lovelace",
      language: "FR",
      expiresAt,
    });
    expect(repository.markFailed).not.toHaveBeenCalled();
  });

  it.each([
    ["is missing", null],
    ["has no owner anymore", buildDataExport({ userId: null })],
    ["is already ready", buildDataExport({ status: "ready" })],
    [
      "has expired",
      buildDataExport({ expiresAt: new Date("2026-11-01T00:00:00.000Z") }),
    ],
  ])("skips the job when the export %s", async (_label, dataExport) => {
    vi.mocked(repository.findById).mockResolvedValue(dataExport);

    const result = await useCase.execute({ exportId: "export-1" });

    expect(result.value).toEqual({ status: "skipped" });
    expect(collector.collect).not.toHaveBeenCalled();
  });

  it("marks the export as failed without retrying when the user no longer exists", async () => {
    vi.mocked(collector.collect).mockResolvedValue(null);

    const result = await useCase.execute({ exportId: "export-1" });

    expect(result.value).toEqual({ status: "skipped" });
    expect(repository.markFailed).toHaveBeenCalledWith("export-1");
    expect(storage.upload).not.toHaveBeenCalled();
  });

  it("marks the export as failed and returns the error so the job is retried", async () => {
    const error = new Error("S3 down");
    vi.mocked(storage.upload).mockRejectedValue(error);

    const result = await useCase.execute({ exportId: "export-1" });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
    expect(repository.markFailed).toHaveBeenCalledWith("export-1");
    expect(repository.markReady).not.toHaveBeenCalled();
    expect(notifier.notifyReady).not.toHaveBeenCalled();
  });

  it("wraps non-Error failures", async () => {
    vi.mocked(archive.create).mockRejectedValue("zip failed");

    const result = await useCase.execute({ exportId: "export-1" });

    expect(result.error.message).toBe("zip failed");
  });

  it("uses the current date by default", async () => {
    const defaultUseCase = new ExportUserDataUseCase(
      repository,
      collector,
      storage,
      archive,
      readme,
      notifier,
    );
    vi.mocked(repository.findById).mockResolvedValue(
      buildDataExport({ expiresAt: new Date("2999-01-01T00:00:00.000Z") }),
    );

    const result = await defaultUseCase.execute({ exportId: "export-1" });

    expect(result.value.status).toBe("ready");
  });
});
