import { describe, expect, it, vi } from "vitest";

import { Result } from "@/shared/application/result";

import type { ExportUserDataUseCase } from "../../application/use-cases/export-user-data.use-case";
import type { GetDataExportDownloadUrlUseCase } from "../../application/use-cases/get-data-export-download-url.use-case";
import type { GetDataExportStatusUseCase } from "../../application/use-cases/get-data-export-status.use-case";
import type { PurgeExpiredDataExportsUseCase } from "../../application/use-cases/purge-expired-data-exports.use-case";
import type { RequestDataExportUseCase } from "../../application/use-cases/request-data-export.use-case";
import { DataExportController } from "../controllers/data-export.controller";

function createController(result: Result<unknown>) {
  const useCase = { execute: vi.fn().mockResolvedValue(result) };

  return {
    useCase,
    controller: new DataExportController(
      useCase as unknown as RequestDataExportUseCase,
      useCase as unknown as ExportUserDataUseCase,
      useCase as unknown as GetDataExportStatusUseCase,
      useCase as unknown as GetDataExportDownloadUrlUseCase,
      useCase as unknown as PurgeExpiredDataExportsUseCase,
    ),
  };
}

describe("DataExportController", () => {
  it("forwards inputs to the use cases and unwraps their value", async () => {
    const { controller, useCase } = createController(Result.ok("value"));

    await expect(controller.requestExport("user-1")).resolves.toBe("value");
    await expect(controller.exportData({ exportId: "export-1" })).resolves.toBe(
      "value",
    );
    await expect(controller.getStatus("user-1")).resolves.toBe("value");
    await expect(controller.getDownloadUrl("user-1", "export-1")).resolves.toBe(
      "value",
    );
    await expect(controller.purgeExpired()).resolves.toBe("value");

    expect(useCase.execute).toHaveBeenCalledWith({ userId: "user-1" });
    expect(useCase.execute).toHaveBeenCalledWith({ exportId: "export-1" });
    expect(useCase.execute).toHaveBeenCalledWith({
      userId: "user-1",
      exportId: "export-1",
    });
    expect(useCase.execute).toHaveBeenCalledWith({});
  });

  it("throws the use case error", async () => {
    const error = new Error("boom");
    const { controller } = createController(Result.fail(error));

    await expect(controller.requestExport("user-1")).rejects.toBe(error);
    await expect(controller.exportData({ exportId: "x" })).rejects.toBe(error);
    await expect(controller.getStatus("user-1")).rejects.toBe(error);
    await expect(controller.getDownloadUrl("user-1", "x")).rejects.toBe(error);
    await expect(controller.purgeExpired()).rejects.toBe(error);
  });
});
