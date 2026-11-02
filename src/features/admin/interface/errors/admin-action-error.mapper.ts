import { ActionError } from "@/lib/errors/action-error";

import { AdminOperationError } from "../../application/errors/admin-operation.error";

const CONFLICT_CODES = new Set([
  "ADMIN_LAST_ADMIN",
  "ADMIN_CANNOT_BAN_SELF",
  "ADMIN_ROLE_ALREADY_EXISTS",
  "ADMIN_ROLE_IN_USE",
  "ADMIN_ROLE_SYSTEM",
]);

export function toAdminActionError(error: unknown): unknown {
  if (error instanceof AdminOperationError) {
    if (error.code === "ADMIN_USER_NOT_FOUND")
      return ActionError.notFound("User", "User not found");

    if (error.code === "ADMIN_ROLE_NOT_FOUND")
      return ActionError.notFound("Role", "Role not found");

    if (error.code === "ADMIN_INSUFFICIENT_PERMISSIONS")
      return ActionError.forbidden(error.message);

    if (CONFLICT_CODES.has(error.code))
      return ActionError.conflict(error.code, error.message);

    return ActionError.badRequest(error.code, error.message);
  }

  return error;
}
