import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import type { UpdateNotificationPreferencesDTO } from "../dto/update-notification-preferences.dto";
import {
  toUserResponseDTO,
  type UserResponseDTO,
} from "../dto/user-response.dto";
import type { IEmailNotifierPort } from "../ports/email-notifier.port";

export class UpdateNotificationPreferencesUseCase implements IUseCase<
  UpdateNotificationPreferencesDTO,
  UserResponseDTO
> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailNotifier: IEmailNotifierPort,
  ) {}

  async execute(
    input: UpdateNotificationPreferencesDTO,
  ): Promise<Result<UserResponseDTO>> {
    const userId = UserId.create(input.userId);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return Result.fail(new UserNotFoundError(input.userId));
    }

    if (input.marketing !== undefined) {
      if (user.shouldSubscribeToMarketing(input.marketing)) {
        const contactId = await this.emailNotifier.subscribeContact(user);
        if (contactId) {
          user.setResendContactId(contactId);
        }
      } else if (user.shouldUnsubscribeFromMarketing(input.marketing)) {
        const resendContactId = user.resendContactId;
        if (resendContactId) {
          await this.emailNotifier.unsubscribeContact(resendContactId);
        }
      }
    }

    user.updateNotificationPreferences({
      type: input.type,
      social: input.social,
      security: input.security,
      marketing: input.marketing,
      communication: input.communication,
    });

    const savedUser = await this.userRepository.save(user);

    return Result.ok(toUserResponseDTO(savedUser));
  }
}
