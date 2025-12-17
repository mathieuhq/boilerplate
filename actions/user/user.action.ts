"use server";

import {
  deleteUserConfirmationSchema,
  updateNotificationPreferencesSchema,
  updateUserProfileSchema,
} from "@/features/user/interface/schemas/user.schema";
import { authAction } from "@/lib/actions/safe-actions";
import { logger } from "@/lib/logger";
import { container } from "@/shared/infrastructure/di/container";
import { ActionResponse } from "@/shared/infrastructure/http";

export const updateUserAction = authAction
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userController = container.getUserController();
    const updatedUser = await userController.updateUserProfile(
      ctx.user.id,
      parsedInput,
    );

    return ActionResponse.success(updatedUser);
  });

export const updateNotificationPreferencesAction = authAction
  .inputSchema(updateNotificationPreferencesSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userController = container.getUserController();
    const updatedUser = await userController.updateNotificationPreferences(
      ctx.user.id,
      parsedInput,
    );

    return ActionResponse.success(updatedUser);
  });

export const deleteUserAction = authAction
  .inputSchema(deleteUserConfirmationSchema)
  .action(async ({ ctx }) => {
    logger.info(`Deleting account for user ${ctx.user.id}`);

    const userController = container.getUserController();
    const result = await userController.deleteUser(ctx.user.id);

    logger.info(`Account deleted successfully for user ${ctx.user.id}`);

    return ActionResponse.success(result);
  });
