import { ApplicationError } from "@/shared/domain/errors/application.error";

export type ApiKeyOperationErrorCode =
  | "API_KEY_SESSION_REQUIRED"
  | "API_KEY_NOT_FOUND"
  | "API_KEY_IMPERSONATION_FORBIDDEN"
  | "API_KEY_INVALID"
  | "API_KEY_RATE_LIMITED";

export class ApiKeyOperationError extends ApplicationError {
  constructor(
    readonly code: ApiKeyOperationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiKeyOperationError";
  }
}
