import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import { toNotificationDTO } from "../dto/notification.dto";
import type { SendNotificationDTO } from "../dto/send-notification.dto";
import type { INotificationPublisherPort } from "../ports/notification-publisher.port";
import type { INotificationRecipientsPort } from "../ports/notification-recipients.port";

type DispatchNotificationOutput = {
  delivered: number;
};

export class DispatchNotificationUseCase implements IUseCase<
  SendNotificationDTO,
  DispatchNotificationOutput
> {
  constructor(
    private readonly recipients: INotificationRecipientsPort,
    private readonly notificationRepository: INotificationRepository,
    private readonly publisher: INotificationPublisherPort,
  ) {}

  async execute(
    input: SendNotificationDTO,
  ): Promise<Result<DispatchNotificationOutput>> {
    const excluded = new Set(input.excludeUserIds);
    const resolved = await this.recipients.resolve(input.audience);
    const userIds = [...new Set(resolved)].filter((id) => !excluded.has(id));

    if (userIds.length === 0) return Result.ok({ delivered: 0 });

    const notifications = await this.notificationRepository.createMany({
      userIds,
      type: input.type,
      data: input.data,
      link: input.link ?? null,
    });

    await Promise.all(
      notifications.map(async (notification) =>
        this.publisher.publish(notification.userId, {
          type: "notification.created",
          notification: toNotificationDTO(notification),
        }),
      ),
    );

    return Result.ok({ delivered: notifications.length });
  }
}
