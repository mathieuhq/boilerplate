import type { SendNotificationDTO } from "../../application/dto/send-notification.dto";
import type {
  INotificationStreamPort,
  NotificationListener,
} from "../../application/ports/notification-publisher.port";
import type { DispatchNotificationUseCase } from "../../application/use-cases/dispatch-notification.use-case";
import type { ListNotificationsUseCase } from "../../application/use-cases/list-notifications.use-case";
import type { MarkAllNotificationsReadUseCase } from "../../application/use-cases/mark-all-notifications-read.use-case";
import type { MarkNotificationsReadUseCase } from "../../application/use-cases/mark-notifications-read.use-case";
import type { PurgeReadNotificationsUseCase } from "../../application/use-cases/purge-read-notifications.use-case";
import type { SendNotificationUseCase } from "../../application/use-cases/send-notification.use-case";

export class NotificationController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly dispatchNotificationUseCase: DispatchNotificationUseCase,
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly markNotificationsReadUseCase: MarkNotificationsReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly purgeReadNotificationsUseCase: PurgeReadNotificationsUseCase,
    private readonly notificationStream: INotificationStreamPort,
  ) {}

  async send(input: SendNotificationDTO) {
    const result = await this.sendNotificationUseCase.execute(input);

    return result.unwrap();
  }

  async dispatch(input: SendNotificationDTO) {
    const result = await this.dispatchNotificationUseCase.execute(input);

    return result.unwrap();
  }

  async listNotifications(
    userId: string,
    input: { limit: number; cursor?: string },
  ) {
    const result = await this.listNotificationsUseCase.execute({
      userId,
      ...input,
    });

    return result.unwrap();
  }

  async markRead(userId: string, ids: string[]) {
    const result = await this.markNotificationsReadUseCase.execute({
      userId,
      ids,
    });

    return result.unwrap();
  }

  async markAllRead(userId: string) {
    const result = await this.markAllNotificationsReadUseCase.execute({
      userId,
    });

    return result.unwrap();
  }

  async purgeRead() {
    const result = await this.purgeReadNotificationsUseCase.execute({});

    return result.unwrap();
  }

  subscribe(userId: string, listener: NotificationListener) {
    return this.notificationStream.subscribe(userId, listener);
  }
}
