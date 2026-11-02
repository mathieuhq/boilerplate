import { HttpError } from "@/shared/domain/errors/http.error";

import { SessionOperationError } from "../../application/errors/session-operation.error";

export function toSessionActionError(error: unknown): unknown {
  if (!(error instanceof SessionOperationError)) return error;

  if (error.code === "SESSION_REQUIRED") return HttpError.unauthorized();

  if (error.code === "SESSION_NOT_FOUND")
    return HttpError.notFound("Session", error.message);

  if (error.code === "SESSION_IMPERSONATION_FORBIDDEN")
    return HttpError.forbidden(error.message);

  return HttpError.badRequest(error.code, error.message);
}
