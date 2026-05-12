import { ApplicationError } from "@/shared/domain/errors/application.error";

export class AdminOperationError extends ApplicationError {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "AdminOperationError";
  }
}
