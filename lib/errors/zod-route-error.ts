import { ApplicationError } from "@/shared/domain/errors/application.error";
import type { HttpStatusCode } from "@/shared/infrastructure/http";
import { HttpStatus } from "@/shared/infrastructure/http";

export class ZodRouteError extends ApplicationError {
  readonly status: HttpStatusCode;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    status: HttpStatusCode = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    super(message);
    this.name = "ZodRouteError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new ZodRouteError(code, message, HttpStatus.BAD_REQUEST, details);
  }

  static unauthorized(message = "Authentication required") {
    return new ZodRouteError("UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message = "Access denied") {
    return new ZodRouteError("FORBIDDEN", message, HttpStatus.FORBIDDEN);
  }

  static notFound(resource = "Resource", message?: string) {
    return new ZodRouteError(
      `${resource.toUpperCase().replace(/\s+/g, "_")}_NOT_FOUND`,
      message ?? `${resource} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  static conflict(code: string, message: string) {
    return new ZodRouteError(code, message, HttpStatus.CONFLICT);
  }

  static validationError(message: string, details?: unknown) {
    return new ZodRouteError(
      "VALIDATION_ERROR",
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    );
  }

  static internalError(message = "An unexpected error occurred") {
    return new ZodRouteError(
      "INTERNAL_ERROR",
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
