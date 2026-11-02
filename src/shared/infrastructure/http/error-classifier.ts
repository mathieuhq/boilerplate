import { logger } from "@/lib/logger";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { HttpError } from "@/shared/domain/errors/http.error";

import type { HttpStatusCode } from "./http-status";
import { HttpStatus } from "./http-status";

export type ClassifiedError = {
  code: string;
  message: string;
  status: HttpStatusCode;
  details?: unknown;
};

export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof HttpError) {
    logger.debug(`[DEV] - ${error.name}`, error.message);
    return {
      code: error.code,
      message: error.message,
      status: error.status,
      details: error.details,
    };
  }

  if (error instanceof DomainError) {
    logger.debug("[DEV] - DomainError", error.message);
    return {
      code: "VALIDATION_ERROR",
      message: error.message,
      status: HttpStatus.UNPROCESSABLE_ENTITY,
    };
  }

  if (error instanceof ApplicationError) {
    logger.debug("[DEV] - ApplicationError", error.message);
    return {
      code: "APPLICATION_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Request failed"
          : error.message,
      status: HttpStatus.BAD_REQUEST,
    };
  }

  logger.info("Unknown Error", error);

  return {
    code: "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : "An unexpected error occurred",
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  };
}
