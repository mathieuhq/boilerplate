import { DomainError } from "@/shared/domain/errors/domain.error";

export class InvalidFileTypeError extends DomainError {
  constructor(providedType: string, allowedTypes: readonly string[]) {
    super(
      `Invalid file type: ${providedType}. Allowed types: ${allowedTypes.join(", ")}`,
    );
    this.name = "InvalidFileTypeError";
  }
}
