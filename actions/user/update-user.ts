"use server";

import { authAction } from "@/lib/actions/safe-actions";
import { userService } from "@/services/user/user.service";
import { ApplicationError } from "@/lib/errors/application-error";
import { updateUserProfileSchema } from "@/schemas/user/user.schema";

/**
 * Update the current user's profile
 *
 * @description
 * Server Action to update authenticated user's profile information.
 * Validates email uniqueness before updating.
 *
 * @example
 * ```ts
 * const { data, serverError } = await updateProfileAction({
 *   name: "John Doe",
 *   email: "john@example.com"
 * });
 * ```
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
