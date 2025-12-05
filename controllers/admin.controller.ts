import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
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
}

export const adminController = new AdminController();
