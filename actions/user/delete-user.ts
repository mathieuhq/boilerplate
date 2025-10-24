"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import { deleteUserConfirmationSchema } from "@/schemas/user/user.schema";
import { userService } from "@/services/user/user.service";

/**
 * Server action to delete authenticated user's account
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
