import { ActionError } from "@/lib/errors/action-error";
import { captureUnexpectedError } from "@/lib/glitchtip";
import { logger } from "@/lib/logger";
import { ApplicationError } from "@/shared/domain/errors/application.error";
import { DomainError } from "@/shared/domain/errors/domain.error";
import { HttpError } from "@/shared/domain/errors/http.error";
import { ActionResponse } from "@/shared/infrastructure/http/api-response";

export function actionErrorResponse(error: unknown) {
  if (error instanceof ActionError) {
    logger.debug("[DEV] - ActionError", error.message);
    return ActionResponse.error(error.code, error.message, error.details);
  }

  if (error instanceof HttpError) {
    logger.debug("[DEV] - HttpError", error.message);
    return ActionResponse.error(error.code, error.message, error.details);
  }

  if (error instanceof DomainError) {
    logger.debug("[DEV] - DomainError", error.message);
    return ActionResponse.error("VALIDATION_ERROR", error.message);
  }

  if (error instanceof ApplicationError) {
    logger.debug("[DEV] - ApplicationError", error.message);

    if (process.env.NODE_ENV === "production")
      return ActionResponse.error("APPLICATION_ERROR", "Request failed");

    return ActionResponse.error("APPLICATION_ERROR", error.message);
  }

  captureUnexpectedError(error);
  logger.info("Unknown Error", error);

  if (process.env.NODE_ENV === "development" && error instanceof Error)
    return ActionResponse.error("INTERNAL_ERROR", error.message);

  return ActionResponse.error("INTERNAL_ERROR", "An unexpected error occurred");
}
