import { DomainError } from "@/shared/domain/errors/domain.error";

export class ForbiddenActionError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenActionError";
  }
}
