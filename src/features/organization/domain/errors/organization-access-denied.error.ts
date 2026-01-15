import { DomainError } from "@/shared/domain/errors/domain.error";

export class OrganizationAccessDeniedError extends DomainError {
  constructor() {
    super("You must be an owner or admin to access organization settings");
    this.name = "OrganizationAccessDeniedError";
  }
}
