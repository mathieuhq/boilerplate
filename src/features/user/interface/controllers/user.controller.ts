import type { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";
import type { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import type { GetUserByIdUseCase } from "../../application/use-cases/get-user-by-id.use-case";
import type { GetUserByStripeCustomerIdUseCase } from "../../application/use-cases/get-user-by-stripe-customer-id.use-case";
import type { GetUserForEmailUseCase } from "../../application/use-cases/get-user-for-email.use-case";
import type { UpdateNotificationPreferencesUseCase } from "../../application/use-cases/update-notification-preferences.use-case";
import type { UpdateUserProfileUseCase } from "../../application/use-cases/update-user-profile.use-case";
import type {
  Language,
  NotificationPreferences,
} from "../../domain/entities/user.types";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  periodStart?: Date;
  periodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
};

type GetActiveSubscriptionsFn = () => Promise<Subscription[]>;

export class UserController {
  constructor(
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getUserForEmailUseCase: GetUserForEmailUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly getUserByStripeCustomerIdUseCase: GetUserByStripeCustomerIdUseCase,
    private readonly updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase,
    private readonly getActiveSubscriptions?: GetActiveSubscriptionsFn,
  ) {}

  async getCurrentUser() {
    const result = await this.getCurrentUserUseCase.execute({});

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async getCurrentUserProfile() {
    const currentUser = await this.getCurrentUser();
    const user = await this.getUserById(currentUser.id);

    return user;
  }

  async getCurrentUserWithSubscription() {
    const user = await this.getCurrentUser();
    const subscriptions = this.getActiveSubscriptions
      ? await this.getActiveSubscriptions()
      : [];

    const subscription = subscriptions[0] ?? null;

    return { user, subscription };
  }

  async getUserById(userId: string) {
    const result = await this.getUserByIdUseCase.execute({ userId });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async updateUserProfile(
    userId: string,
    input: {
      name?: string;
      email?: string;
      image?: string;
      birthDate?: Date;
      language?: Language;
    },
  ) {
    const result = await this.updateUserProfileUseCase.execute({
      userId,
      ...input,
    });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async updateNotificationPreferences(
    userId: string,
    input: {
      social_emails?: boolean;
      security_emails?: boolean;
      marketing_emails?: boolean;
      communication_emails?: boolean;
      type?: NotificationPreferences["type"];
    },
  ) {
    const result = await this.updateNotificationPreferencesUseCase.execute({
      userId,
      type: input.type,
      social: input.social_emails,
      security: input.security_emails,
      marketing: input.marketing_emails,
      communication: input.communication_emails,
    });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async deleteUser(userId: string) {
    const result = await this.deleteUserUseCase.execute({ userId });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async getUserForEmail(userId: string) {
    const result = await this.getUserForEmailUseCase.execute({ userId });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string) {
    const result = await this.getUserByStripeCustomerIdUseCase.execute({
      stripeCustomerId,
    });

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
