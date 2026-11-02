import { DomainError } from "@/shared/domain/errors/domain.error";

export class DataExportRateLimitedError extends DomainError {
  constructor(readonly nextAvailableAt: Date) {
    super(
      `A data export was already requested in the last 24 hours. Try again after ${nextAvailableAt.toISOString()}`,
    );
    this.name = "DataExportRateLimitedError";
  }
}
