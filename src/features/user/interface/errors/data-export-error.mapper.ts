import { ActionError } from "@/lib/errors/action-error";
import { HttpError } from "@/shared/domain/errors/http.error";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

import { DataExportExpiredError } from "../../domain/errors/data-export-expired.error";
import { DataExportNotFoundError } from "../../domain/errors/data-export-not-found.error";
import { DataExportRateLimitedError } from "../../domain/errors/data-export-rate-limited.error";

export function toDataExportActionError(error: unknown): unknown {
  if (error instanceof DataExportRateLimitedError)
    return new ActionError(
      "DATA_EXPORT_RATE_LIMITED",
      "You can request one data export every 24 hours",
      { nextAvailableAt: error.nextAvailableAt.toISOString() },
    );

  return error;
}

export function toDataExportHttpError(error: unknown): unknown {
  if (error instanceof DataExportNotFoundError)
    return HttpError.notFound("Data export");

  if (error instanceof DataExportExpiredError)
    return new HttpError(
      "DATA_EXPORT_EXPIRED",
      "This data export has expired",
      HttpStatus.GONE,
    );

  return error;
}
