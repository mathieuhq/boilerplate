import { DomainError } from "@/shared/domain/errors/domain.error";

export class InvalidSearchTermError extends DomainError {
  constructor(minLength: number, maxLength: number) {
    super(
      `Search queries must contain between ${minLength} and ${maxLength} characters`,
    );
    this.name = "InvalidSearchTermError";
  }
}
