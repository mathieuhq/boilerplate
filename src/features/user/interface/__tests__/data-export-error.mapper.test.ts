import { describe, expect, it } from "vitest";

import { ActionError } from "@/lib/errors/action-error";
import { HttpError } from "@/shared/domain/errors/http.error";

import { DataExportExpiredError } from "../../domain/errors/data-export-expired.error";
import { DataExportNotFoundError } from "../../domain/errors/data-export-not-found.error";
import { DataExportRateLimitedError } from "../../domain/errors/data-export-rate-limited.error";
import {
  toDataExportActionError,
  toDataExportHttpError,
} from "../errors/data-export-error.mapper";

describe("data export error mappers", () => {
  it("maps the rate limit to an action error with the next available date", () => {
    const error = toDataExportActionError(
      new DataExportRateLimitedError(new Date("2026-11-03T10:00:00.000Z")),
    );

    expect(error).toBeInstanceOf(ActionError);
    expect(error).toMatchObject({
      code: "DATA_EXPORT_RATE_LIMITED",
      details: { nextAvailableAt: "2026-11-03T10:00:00.000Z" },
    });
  });

  it("maps missing and expired exports to HTTP errors", () => {
    expect(
      toDataExportHttpError(new DataExportNotFoundError("export-1")),
    ).toMatchObject({ status: 404, code: "DATA_EXPORT_NOT_FOUND" });
    expect(
      toDataExportHttpError(new DataExportExpiredError("export-1")),
    ).toMatchObject({ status: 410, code: "DATA_EXPORT_EXPIRED" });
    expect(
      toDataExportHttpError(new DataExportNotFoundError("x")),
    ).toBeInstanceOf(HttpError);
  });

  it("returns other errors unchanged", () => {
    const error = new Error("boom");

    expect(toDataExportActionError(error)).toBe(error);
    expect(toDataExportHttpError(error)).toBe(error);
  });
});
