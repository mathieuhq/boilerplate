"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { ApplicationError } from "@/lib/errors/application-error";
import { updateUserProfileSchema } from "@/schemas/user/user.schema";
import { userService } from "@/services/user/user.service";

/**
 * Server action to update authenticated user's profile
 */
export const updateUserAction = authAction
  .inputSchema(updateUserProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.email) {
      const emailTaken = await userService.isEmailTaken(
        parsedInput.email,
        ctx.user.id,
      );

      if (emailTaken) throw new ApplicationError("Email is already taken");
    }

    const updatedUser = await userService.updateUser(ctx.user.id, parsedInput);

    return {
      success: true,
      user: updatedUser,
    };
  });
