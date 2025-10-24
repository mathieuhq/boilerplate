import {
  type ListUsersQueryInput,
  listUsersQuerySchema,
  type UpdateUserWithIdInput,
  updateUserWithIdSchema,
  type UserIdInput,
  userIdSchema,
} from "@/schemas/user/user.schema";
import { userService } from "@/services/user/user.service";

export type ListUsersInput = ListUsersQueryInput;
export type GetUserByIdInput = UserIdInput;
export type UpdateUserInput = UpdateUserWithIdInput;
export type DeleteUserInput = UserIdInput;

/**
 * Controller layer for user operations with validation
 */
export class UserController {
  /**
   * Lists users with pagination and search
   */
  async listUsers(input: unknown) {
    const validationResult = listUsersQuerySchema.safeParse(input);

    if (!validationResult.success)
      return {
        success: false,
        error: "Validation failed",
        details: validationResult.error.issues,
      };

    const result = await userService.listUsers(validationResult.data);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Gets user by ID
   */
  async getUserById(input: unknown) {
    const validationResult = userIdSchema.safeParse(input);

    if (!validationResult.success)
      return {
        success: false,
        error: "Validation failed",
        details: validationResult.error.issues,
      };

    const user = await userService.getUserById(validationResult.data.id);

    if (!user)
      return {
        success: false,
        error: "User not found",
      };

    return {
      success: true,
      data: { user },
    };
  }

  /**
   * Updates user profile
   */
  async updateUser(input: unknown) {
    const validationResult = updateUserWithIdSchema.safeParse(input);

    if (!validationResult.success)
      return {
        success: false,
        error: "Validation failed",
        details: validationResult.error.issues,
      };

    const { id, ...updateData } = validationResult.data;

    if (updateData.email) {
      const emailTaken = await userService.isEmailTaken(updateData.email, id);

      if (emailTaken)
        return {
          success: false,
          error: "Email is already taken",
        };
    }

    const user = await userService.updateUser(id, updateData);

    return {
      success: true,
      data: { user },
    };
  }

  /**
   * Deletes user account
   */
  async deleteUser(input: unknown) {
    const validationResult = userIdSchema.safeParse(input);

    if (!validationResult.success)
      return {
        success: false,
        error: "Validation failed",
        details: validationResult.error.issues,
      };

    await userService.deleteUser(validationResult.data.id);

    return {
      success: true,
      data: { message: "User deleted successfully" },
    };
  }
}

export const userController = new UserController();
