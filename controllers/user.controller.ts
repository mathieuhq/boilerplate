import { ApplicationError } from "@/lib/errors/application-error";
import type {
  ListUsersQueryInput,
  UpdateNotificationPreferencesInput,
  UpdateUserProfileInput,
  UpdateUserWithIdInput,
} from "@/schemas/user/user.schema";
import { authService } from "@/services/auth/auth.service";
import { userService } from "@/services/user/user.service";

import { emailController } from "./email.controller";

/**
 * Controller layer for user operations (business logic)
 * Accepts already validated data from routes/actions
 */
class UserController {
  /**
   * Gets the current authenticated user
   * Used by layouts and pages that need authentication
   */
  async getCurrentUser() {
    const user = await authService.getRequiredUser();

    return user;
  }

  /**
   * Gets the current authenticated user's full profile
   * Combines authentication check with user data fetch
   */
  async getCurrentUserProfile() {
    const currentUser = await authService.getRequiredUser();
    const user = await userService.getUserById(currentUser.id);

    if (!user) throw new ApplicationError("User not found");

    return user;
  }

  /**
   * Gets the current authenticated user with their active subscription
   * Used by billing page to display subscription status
   */
  async getCurrentUserWithSubscription() {
    const user = await authService.getRequiredUser();
    const subscriptions = await authService.getActiveSubscriptions();

    const subscription = subscriptions[0] || null;

    return { user, subscription };
  }

  /**
   * Lists users with pagination and search
   */
  async listUsers(input: ListUsersQueryInput) {
    const result = await userService.listUsers(input);

    return result;
  }

  /**
   * Gets user by ID
   */
  async getUserById(userId: string) {
    const user = await userService.getUserById(userId);

    if (!user) throw new ApplicationError("User not found");

    return user;
  }

  /**
   * Updates user profile (with ID)
   */
  async updateUserWithId(input: UpdateUserWithIdInput) {
    const { id, ...updateData } = input;

    if (updateData.email) {
      const emailTaken = await userService.isEmailTaken(updateData.email, id);

      if (emailTaken) throw new ApplicationError("Email is already taken");
    }

    const user = await userService.updateUser(id, updateData);

    return user;
  }

  /**
   * Updates authenticated user's profile
   */
  async updateUserProfile(userId: string, input: UpdateUserProfileInput) {
    if (input.email) {
      const emailTaken = await userService.isEmailTaken(input.email, userId);

      if (emailTaken) throw new ApplicationError("Email is already taken");
    }

    const user = await userService.updateUser(userId, input);

    return user;
  }

  /**
   * Updates notification preferences with Resend integration
   * Handles subscription/unsubscription based on marketing email preference changes
   */
  async updateNotificationPreferences(
    userId: string,
    input: UpdateNotificationPreferencesInput,
  ) {
    const currentUser = await userService.getUserById(userId);

    if (!currentUser) throw new ApplicationError("User not found");

    const updateData = {
      notificationType: input.type,
      socialEmails: input.social_emails,
      securityEmails: input.security_emails,
      marketingEmails: input.marketing_emails,
      communicationEmails: input.communication_emails,
    };

    if (
      input.marketing_emails !== undefined &&
      input.marketing_emails !== currentUser.marketingEmails
    ) {
      if (input.marketing_emails === true && !currentUser.marketingEmails) {
        await emailController.subscribeContact({ userId });
      } else if (
        input.marketing_emails === false &&
        currentUser.marketingEmails
      ) {
        await emailController.unsubscribeContact({ userId });
      }
    }

    const user = await userService.updateUser(userId, updateData);

    return user;
  }

  /**
   * Deletes user account
   */
  async deleteUser(userId: string) {
    await userService.deleteUser(userId);

    return {
      success: true,
      message: "User deleted successfully",
    };
  }

  /**
   * Gets user email and name for transactional emails
   * Used by Stripe subscription hooks
   */
  async getUserForEmail(userId: string) {
    const user = await userService.getUserById(userId);

    if (!user) return null;

    return { email: user.email, name: user.name };
  }

  /**
   * Gets user by Stripe customer ID
   * Used for payment failure notifications
   */
  async getUserByStripeCustomerId(stripeCustomerId: string) {
    const user = await userService.getUserByStripeCustomerId(stripeCustomerId);

    if (!user) return null;

    return { email: user.email, name: user.name };
  }
}

export const userController = new UserController();
