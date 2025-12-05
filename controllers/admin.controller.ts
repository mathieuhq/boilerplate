import { env } from "@/lib/env";
import { ApplicationError } from "@/lib/errors/application-error";
import { logger } from "@/lib/logger";
import type {
  ListUsersInput,
  SetUserPasswordInput,
  SetUserRoleInput,
} from "@/schemas/admin/admin.schema";
import { authService } from "@/services/auth/auth.service";

/**
 * Controller layer for admin operations (business logic)
 */
class AdminController {
  /**
   * Promotes user to admin if their email matches ADMIN_EMAIL env var
   * Called after user creation to set up the original admin
   */
  async promoteToAdminIfOriginal(userId: string, email: string) {
    if (!env.BETTER_AUTH_ADMIN_EMAIL) return false;

    if (email.toLowerCase() !== env.BETTER_AUTH_ADMIN_EMAIL.toLowerCase())
      return false;

    try {
      await authService.setUserRole(userId, "admin");

      logger.info("User promoted to admin (original admin)", {
        userId,
        email,
      });

      return true;
    } catch (error) {
      logger.error("Failed to promote user to admin", {
        userId,
        email,
        error,
      });

      return false;
    }
  }

  /**
   * Removes a user (admin only)
   * Prevents admin from removing themselves
   */
  async removeUser(userId: string, adminUserId: string) {
    if (userId === adminUserId) {
      throw new ApplicationError("Cannot remove your own account");
    }

    const result = await authService.removeUser(userId);

    logger.info("User removed by admin", {
      removedUserId: userId,
      adminUserId,
    });

    return result;
  }

  /**
   * Lists users with pagination and search (admin only)
   */
  async listUsers(input: ListUsersInput) {
    const result = await authService.listUsers(input);

    return result;
  }

  /**
   * Sets a user's role (admin only)
   * Prevents admin from changing their own role
   */
  async setUserRole(input: SetUserRoleInput, adminUserId: string) {
    if (input.userId === adminUserId) {
      throw new ApplicationError("Cannot change your own role");
    }

    const result = await authService.setUserRole(input.userId, input.role);

    logger.info("User role updated by admin", {
      targetUserId: input.userId,
      newRole: input.role,
      adminUserId,
    });

    return result;
  }

  /**
   * Sets a user's password (admin only)
   */
  async setUserPassword(input: SetUserPasswordInput) {
    const result = await authService.setUserPassword(
      input.userId,
      input.newPassword,
    );

    logger.info("User password updated by admin", {
      targetUserId: input.userId,
    });

    return result;
  }
}

export const adminController = new AdminController();
