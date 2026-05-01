import { ApplicationError } from "@/shared/domain/errors/application.error";

export class OrganizationOperationError extends ApplicationError {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "OrganizationOperationError";
  }
}
