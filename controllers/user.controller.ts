import { userService } from "@/services/user/user.service";
import {
  listUsersQuerySchema,
  updateUserWithIdSchema,
  userIdSchema,
  type ListUsersQueryInput,
  type UpdateUserWithIdInput,
  type UserIdInput,
} from "@/schemas/user/user.schema";

export type ListUsersInput = ListUsersQueryInput;
export type GetUserByIdInput = UserIdInput;
export type UpdateUserInput = UpdateUserWithIdInput;
export type DeleteUserInput = UserIdInput;

/**
 * User Controller
 *
 * @description
 * Controller layer for user-related operations.
 * Handles validation and delegates business logic to UserService.
 * Can be used by API routes, Server Actions, or other entry points.
 */
export class UserController {
  /**
   * List users with pagination and search
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
   * Get user by ID
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
   * Update user profile
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
   * Delete user account
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
