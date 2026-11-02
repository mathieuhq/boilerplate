import { ActionError } from "@/lib/errors/action-error";

import { SessionOperationError } from "../../application/errors/session-operation.error";

export function toSessionActionError(error: unknown): unknown {
  if (!(error instanceof SessionOperationError)) return error;

  if (error.code === "SESSION_REQUIRED") return ActionError.unauthorized();

  if (error.code === "SESSION_NOT_FOUND")
    return ActionError.notFound("Session", error.message);

  if (error.code === "SESSION_IMPERSONATION_FORBIDDEN")
    return ActionError.forbidden(error.message);

  return ActionError.badRequest(error.code, error.message);
}
