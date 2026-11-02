import type { DeleteUserUseCase } from "../../application/use-cases/delete-user.use-case";
import type { GetCurrentUserUseCase } from "../../application/use-cases/get-current-user.use-case";
import type { GetUserByIdUseCase } from "../../application/use-cases/get-user-by-id.use-case";
import type { GetUserForEmailUseCase } from "../../application/use-cases/get-user-for-email.use-case";
import type { UpdateNotificationPreferencesUseCase } from "../../application/use-cases/update-notification-preferences.use-case";
import type { UpdateUserProfileUseCase } from "../../application/use-cases/update-user-profile.use-case";
import type {
  Language,
  NotificationPreferences,
} from "../../domain/entities/user.types";

export class UserController {
  constructor(
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getUserForEmailUseCase: GetUserForEmailUseCase,
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly updateNotificationPreferencesUseCase: UpdateNotificationPreferencesUseCase,
  ) {}

  async getCurrentUser() {
    const result = await this.getCurrentUserUseCase.execute({});

    return result.unwrap();
  }

  async getCurrentUserProfile() {
    return this.getCurrentUser();
  }

  async getUserById(userId: string) {
    const result = await this.getUserByIdUseCase.execute({ userId });

    return result.unwrap();
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

    return result.unwrap();
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

    return result.unwrap();
  }

  async deleteUser(userId: string) {
    const result = await this.deleteUserUseCase.execute({ userId });

    return result.unwrap();
  }

  async getUserForEmail(userId: string) {
    const result = await this.getUserForEmailUseCase.execute({ userId });

    return result.unwrap();
  }
}
