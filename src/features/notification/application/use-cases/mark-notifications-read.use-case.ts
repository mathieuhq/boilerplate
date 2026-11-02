import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import type { INotificationPublisherPort } from "../ports/notification-publisher.port";

type MarkNotificationsReadInput = {
  userId: string;
  ids: string[];
};

type MarkNotificationsReadOutput = {
  ids: string[];
};

export class MarkNotificationsReadUseCase implements IUseCase<
  MarkNotificationsReadInput,
  MarkNotificationsReadOutput
> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly publisher: INotificationPublisherPort,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: MarkNotificationsReadInput,
  ): Promise<Result<MarkNotificationsReadOutput>> {
    const ids = await this.notificationRepository.markRead(
      input.userId,
      [...new Set(input.ids)],
      this.now(),
    );

    if (ids.length > 0)
      await this.publisher.publish(input.userId, {
        type: "notification.read",
        ids,
      });

    return Result.ok({ ids });
  }
}
