import { ApplicationError } from "@/shared/domain/errors/application.error";

export class ActionError extends ApplicationError {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "ActionError";
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new ActionError(code, message, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ActionError("UNAUTHORIZED", message);
  }

  static forbidden(message = "Access denied") {
    return new ActionError("FORBIDDEN", message);
  }

  static notFound(resource = "Resource", message?: string) {
    return new ActionError(
      `${resource.toUpperCase().replace(/\s+/g, "_")}_NOT_FOUND`,
      message ?? `${resource} not found`,
    );
  }

  static conflict(code: string, message: string) {
    return new ActionError(code, message);
  }

  static validationError(message: string, details?: unknown) {
    return new ActionError("VALIDATION_ERROR", message, details);
  }
}
