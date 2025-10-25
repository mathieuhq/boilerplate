"use server";

import { userController } from "@/controllers/user.controller";
import { authAction } from "@/lib/actions/safe-actions";
import { updateUserProfileSchema } from "@/schemas/user/user.schema";

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
