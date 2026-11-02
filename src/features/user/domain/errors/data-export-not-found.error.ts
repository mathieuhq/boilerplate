import { DomainError } from "@/shared/domain/errors/domain.error";

export class DataExportNotFoundError extends DomainError {
  constructor(exportId: string) {
    super(`Data export not found: ${exportId}`);
    this.name = "DataExportNotFoundError";
  }
}
