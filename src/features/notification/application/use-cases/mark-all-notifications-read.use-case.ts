import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import type { INotificationPublisherPort } from "../ports/notification-publisher.port";

type MarkAllNotificationsReadInput = {
  userId: string;
};

type MarkAllNotificationsReadOutput = {
  count: number;
};

export class MarkAllNotificationsReadUseCase implements IUseCase<
  MarkAllNotificationsReadInput,
  MarkAllNotificationsReadOutput
> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly publisher: INotificationPublisherPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: MarkAllNotificationsReadInput,
  ): Promise<Result<MarkAllNotificationsReadOutput>> {
    const count = await this.notificationRepository.markAllRead(
      input.userId,
      this.now(),
    );

    if (count > 0)
      await this.publisher.publish(input.userId, {
        type: "notification.read-all",
      });

    return Result.ok({ count });
  }
}
