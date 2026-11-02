import { DomainError } from "@/shared/domain/errors/domain.error";

export class DataExportExpiredError extends DomainError {
  constructor(exportId: string) {
    super(`Data export has expired: ${exportId}`);
    this.name = "DataExportExpiredError";
  }
}
