import { ApplicationError } from "@/shared/domain/errors/application.error";

export type SessionOperationErrorCode =
  | "SESSION_REQUIRED"
  | "SESSION_NOT_FOUND"
  | "SESSION_IS_CURRENT"
  | "SESSION_IMPERSONATION_FORBIDDEN";

export class SessionOperationError extends ApplicationError {
  constructor(
    readonly code: SessionOperationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SessionOperationError";
  }
}
