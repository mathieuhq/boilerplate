import { HttpError } from "@/shared/domain/errors/http.error";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

import { ApiKeyOperationError } from "../../application/errors/api-key-operation.error";

export function toApiKeyActionError(error: unknown): unknown {
  if (!(error instanceof ApiKeyOperationError)) return error;

  if (error.code === "API_KEY_SESSION_REQUIRED")
    return HttpError.unauthorized();

  if (error.code === "API_KEY_INVALID")
    return HttpError.unauthorized(error.message);

  if (error.code === "API_KEY_RATE_LIMITED")
    return new HttpError(
      "RATE_LIMITED",
      error.message,
      HttpStatus.TOO_MANY_REQUESTS,
    );

  if (error.code === "API_KEY_NOT_FOUND")
    return HttpError.notFound("API key", error.message);

  return HttpError.forbidden(error.message);
}
