import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { IDataExportStoragePort } from "../ports/data-export-storage.port";
import { PurgeExpiredDataExportsUseCase } from "../use-cases/purge-expired-data-exports.use-case";

import {
  buildDataExport,
  createMockDataExportRepository,
  createMockDataExportStorage,
  NOW,
} from "./data-export.mocks";

describe("PurgeExpiredDataExportsUseCase", () => {
  let repository: IDataExportRepository;
  let storage: IDataExportStoragePort;
  let useCase: PurgeExpiredDataExportsUseCase;

  beforeEach(() => {
    repository = createMockDataExportRepository();
    storage = createMockDataExportStorage();
    useCase = new PurgeExpiredDataExportsUseCase(
      repository,
      storage,
      () => NOW,
    );

    vi.mocked(repository.deleteMany).mockImplementation(
      async (ids) => ids.length,
    );
  });

  it("deletes expired S3 objects then their rows, batch after batch", async () => {
    vi.mocked(repository.findExpired)
      .mockResolvedValueOnce([
        buildDataExport({ id: "a", fileKey: "data-exports/user-1/a.zip" }),
        buildDataExport({ id: "b", fileKey: null }),
      ])
      .mockResolvedValueOnce([
        buildDataExport({ id: "c", fileKey: "data-exports/user-1/c.zip" }),
      ])
      .mockResolvedValueOnce([]);

    const result = await useCase.execute({});

    expect(result.value).toEqual({ deleted: 3, failed: 0 });
    expect(repository.findExpired).toHaveBeenCalledWith(NOW, 100);
    expect(storage.delete).toHaveBeenCalledTimes(2);
    expect(storage.delete).toHaveBeenCalledWith("data-exports/user-1/a.zip");
    expect(storage.delete).toHaveBeenCalledWith("data-exports/user-1/c.zip");
    expect(repository.deleteMany).toHaveBeenNthCalledWith(1, ["a", "b"]);
    expect(repository.deleteMany).toHaveBeenNthCalledWith(2, ["c"]);
  });

  it("keeps rows whose object could not be deleted for the next run", async () => {
    const failing = buildDataExport({
      id: "a",
      fileKey: "data-exports/user-1/a.zip",
    });
    vi.mocked(storage.delete).mockRejectedValue(new Error("S3 down"));
    vi.mocked(repository.findExpired).mockResolvedValue([failing]);

    const result = await useCase.execute({});

    expect(result.value).toEqual({ deleted: 0, failed: 1 });
    expect(repository.deleteMany).not.toHaveBeenCalled();
    expect(repository.findExpired).toHaveBeenCalledTimes(2);
  });

  it("uses the current date by default", async () => {
    vi.mocked(repository.findExpired).mockResolvedValue([]);

    const result = await new PurgeExpiredDataExportsUseCase(
      repository,
      storage,
    ).execute({});

    expect(result.value).toEqual({ deleted: 0, failed: 0 });
  });
});
