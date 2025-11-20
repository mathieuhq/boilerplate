"use server";

import { userController } from "@/controllers/user.controller";
import { authAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import {
  deleteUserConfirmationSchema,
  updateNotificationPreferencesSchema,
  updateUserProfileSchema,
} from "@/schemas/user/user.schema";

/**
 * Server action to update authenticated user's profile
 */
export const updateUserAction = authAction
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const updatedUser = await userController.updateUserProfile(
      ctx.user.id,
      parsedInput,
    );

    return {
      success: true,
      user: updatedUser,
    };
  });

/**
 * Server action to update notification preferences
 */
export const updateNotificationPreferencesAction = authAction
  .inputSchema(updateNotificationPreferencesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const updatedUser = await userController.updateNotificationPreferences(
      ctx.user.id,
      parsedInput,
    );

    return {
      success: true,
      user: updatedUser,
    };
  });

/**
 * Server action to delete authenticated user's account
 */
export const deleteUserAction = authAction
  .inputSchema(deleteUserConfirmationSchema)
  .action(async ({ ctx }) => {
    logger.info(`Deleting account for user ${ctx.user.id}`);

    const result = await userController.deleteUser(ctx.user.id);

    logger.info(`Account deleted successfully for user ${ctx.user.id}`);

    return result;
  });
