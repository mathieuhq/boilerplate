import { describe, expect, it } from "vitest";

import { buildDataExport } from "../../application/__tests__/data-export.mocks";
import {
  DATA_EXPORT_COOLDOWN_MS,
  DATA_EXPORT_RETENTION_MS,
  getDataExportDownloadPath,
  getDataExportExpiresAt,
  getDataExportFileKey,
  getDataExportFileName,
  getNextDataExportAt,
  isDataExportExpired,
} from "../data-export.policy";
import { DataExportExpiredError } from "../errors/data-export-expired.error";
import { DataExportNotFoundError } from "../errors/data-export-not-found.error";
import { DataExportRateLimitedError } from "../errors/data-export-rate-limited.error";

describe("data export policy", () => {
  const createdAt = new Date("2026-11-02T10:00:00.000Z");

  describe("getNextDataExportAt", () => {
    it("allows a new export when there is no previous export", () => {
      expect(getNextDataExportAt(null, createdAt)).toBeNull();
    });

    it("ignores failed exports", () => {
      const latest = buildDataExport({ status: "failed", createdAt });

      expect(getNextDataExportAt(latest, createdAt)).toBeNull();
    });

    it("blocks a new export during the 24 hour cooldown", () => {
      const latest = buildDataExport({ status: "ready", createdAt });
      const now = new Date(createdAt.getTime() + 60_000);

      expect(getNextDataExportAt(latest, now)).toEqual(
        new Date(createdAt.getTime() + DATA_EXPORT_COOLDOWN_MS),
      );
    });

    it("allows a new export once the cooldown is over", () => {
      const latest = buildDataExport({ status: "pending", createdAt });
      const now = new Date(createdAt.getTime() + DATA_EXPORT_COOLDOWN_MS);

      expect(getNextDataExportAt(latest, now)).toBeNull();
    });
  });

  it("expires exports 7 days after the given date", () => {
    expect(getDataExportExpiresAt(createdAt)).toEqual(
      new Date(createdAt.getTime() + DATA_EXPORT_RETENTION_MS),
    );
    expect(DATA_EXPORT_RETENTION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("detects expired exports", () => {
    const dataExport = buildDataExport({ expiresAt: createdAt });

    expect(isDataExportExpired(dataExport, createdAt)).toBe(true);
    expect(
      isDataExportExpired(dataExport, new Date(createdAt.getTime() - 1)),
    ).toBe(false);
  });

  it("builds storage keys, file names and download paths", () => {
    expect(getDataExportFileKey("user-1", "export-1")).toBe(
      "data-exports/user-1/export-1.zip",
    );
    expect(getDataExportFileName(createdAt)).toBe("data-export-2026-11-02.zip");
    expect(getDataExportDownloadPath("export-1")).toBe(
      "/api/v1/private/user/export/export-1",
    );
  });

  it("exposes descriptive errors", () => {
    const nextAvailableAt = new Date("2026-11-03T10:00:00.000Z");
    const rateLimited = new DataExportRateLimitedError(nextAvailableAt);

    expect(rateLimited.name).toBe("DataExportRateLimitedError");
    expect(rateLimited.nextAvailableAt).toBe(nextAvailableAt);
    expect(rateLimited.message).toContain("2026-11-03T10:00:00.000Z");
    expect(new DataExportNotFoundError("export-1").name).toBe(
      "DataExportNotFoundError",
    );
    expect(new DataExportExpiredError("export-1").message).toBe(
      "Data export has expired: export-1",
    );
  });
});
