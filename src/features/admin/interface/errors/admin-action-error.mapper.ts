import { ActionError } from "@/lib/errors/action-error";

import { AdminOperationError } from "../../application/errors/admin-operation.error";

export function toAdminActionError(error: unknown): unknown {
  if (error instanceof AdminOperationError) {
    if (error.code === "ADMIN_USER_NOT_FOUND")
      return ActionError.notFound("User", "User not found");

    if (
      error.code === "ADMIN_LAST_ADMIN" ||
      error.code === "ADMIN_CANNOT_BAN_SELF"
    )
      return ActionError.conflict(error.code, error.message);

    return ActionError.badRequest(error.code, error.message);
  }

  return error;
}
