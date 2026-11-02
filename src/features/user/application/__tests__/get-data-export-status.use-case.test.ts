import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import { GetDataExportStatusUseCase } from "../use-cases/get-data-export-status.use-case";

import {
  buildDataExport,
  createMockDataExportRepository,
  NOW,
} from "./data-export.mocks";

describe("GetDataExportStatusUseCase", () => {
  let repository: IDataExportRepository;
  let useCase: GetDataExportStatusUseCase;

  beforeEach(() => {
    repository = createMockDataExportRepository();
    useCase = new GetDataExportStatusUseCase(repository, () => NOW);
  });

  it("returns an empty status when the user never exported data", async () => {
    vi.mocked(repository.findLatestByUserId).mockResolvedValue(null);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.value).toEqual({ latest: null, nextAvailableAt: null });
  });

  it("returns the latest export and the next available date", async () => {
    const dataExport = buildDataExport({ status: "ready" });
    vi.mocked(repository.findLatestByUserId).mockResolvedValue(dataExport);

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.value).toEqual({
      latest: {
        id: "export-1",
        status: "ready",
        createdAt: "2026-11-02T10:00:00.000Z",
        expiresAt: "2026-11-09T10:00:00.000Z",
      },
      nextAvailableAt: "2026-11-03T10:00:00.000Z",
    });
    expect(repository.findLatestByUserId).toHaveBeenCalledWith("user-1", [
      "pending",
      "ready",
      "failed",
    ]);
    expect(repository.findLatestByUserId).toHaveBeenCalledWith("user-1", [
      "pending",
      "ready",
    ]);
  });

  it("hides expired exports", async () => {
    vi.mocked(repository.findLatestByUserId).mockResolvedValue(
      buildDataExport({
        status: "ready",
        createdAt: new Date("2026-10-20T00:00:00.000Z"),
        expiresAt: new Date("2026-10-27T00:00:00.000Z"),
      }),
    );

    const result = await useCase.execute({ userId: "user-1" });

    expect(result.value).toEqual({ latest: null, nextAvailableAt: null });
  });

  it("uses the current date by default", async () => {
    vi.mocked(repository.findLatestByUserId).mockResolvedValue(null);

    const result = await new GetDataExportStatusUseCase(repository).execute({
      userId: "user-1",
    });

    expect(result.isSuccess).toBe(true);
  });
});
