import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type {
  INotificationRepository,
  ListNotificationsQuery,
} from "../../domain/repositories/notification.repository.interface";
import {
  type NotificationListDTO,
  toNotificationDTO,
} from "../dto/notification.dto";

export class ListNotificationsUseCase implements IUseCase<
  ListNotificationsQuery,
  NotificationListDTO
> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    input: ListNotificationsQuery,
  ): Promise<Result<NotificationListDTO>> {
    const [page, unreadCount] = await Promise.all([
      this.notificationRepository.list(input),
      this.notificationRepository.countUnread(input.userId),
    ]);

    return Result.ok({
      items: page.items.map(toNotificationDTO),
      nextCursor: page.nextCursor,
      unreadCount,
    });
  }
}
