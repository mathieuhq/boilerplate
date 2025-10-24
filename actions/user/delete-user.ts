"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import { deleteUserConfirmationSchema } from "@/schemas/user/user.schema";
import { userService } from "@/services/user/user.service";

/**
 * Delete the current user's account
 *
 * @description
 * Server Action to permanently delete the authenticated user's account.
 * This will cascade delete all related sessions and accounts.
 *
 * @example
 * ```ts
 * const { data, serverError } = await deleteAccountAction({
 *   confirmation: true
 * });
 * ```
 */
export const deleteUserAction = authAction
  .inputSchema(deleteUserConfirmationSchema)
  .action(async ({ ctx }) => {
    logger.info(`Deleting account for user ${ctx.user.id}`);

    await userService.deleteUser(ctx.user.id);

    logger.info(`Account deleted successfully for user ${ctx.user.id}`);

    return {
      success: true,
      message: "Account deleted successfully",
    };
  });
