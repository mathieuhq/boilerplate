import type { HttpStatusCode } from "@/shared/infrastructure/http/http-status";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

import { ApplicationError } from "./application.error";

export class HttpError extends ApplicationError {
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
    this.name = "HttpError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new HttpError(code, message, HttpStatus.BAD_REQUEST, details);
  }

  static unauthorized(message = "Authentication required") {
    return new HttpError("UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
  }

  static forbidden(message = "Access denied") {
    return new HttpError("FORBIDDEN", message, HttpStatus.FORBIDDEN);
  }

  static notFound(resource = "Resource", message?: string) {
    return new HttpError(
      `${resource.toUpperCase().replace(/\s+/g, "_")}_NOT_FOUND`,
      message ?? `${resource} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  static conflict(code: string, message: string) {
    return new HttpError(code, message, HttpStatus.CONFLICT);
  }

  static validationError(message: string, details?: unknown) {
    return new HttpError(
      "VALIDATION_ERROR",
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      details,
    );
  }

  static internalError(message = "An unexpected error occurred") {
    return new HttpError(
      "INTERNAL_ERROR",
      message,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
