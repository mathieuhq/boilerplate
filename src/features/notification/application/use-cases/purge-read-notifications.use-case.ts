import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";

const READ_NOTIFICATION_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

type PurgeReadNotificationsInput = Record<string, never>;

type PurgeReadNotificationsOutput = {
  deleted: number;
};

export class PurgeReadNotificationsUseCase implements IUseCase<
  PurgeReadNotificationsInput,
  PurgeReadNotificationsOutput
> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    _input: PurgeReadNotificationsInput,
  ): Promise<Result<PurgeReadNotificationsOutput>> {
    const cutoff = new Date(
      this.now().getTime() - READ_NOTIFICATION_RETENTION_MS,
    );
    const deleted = await this.notificationRepository.deleteReadBefore(cutoff);

    return Result.ok({ deleted });
  }
}
