import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { NotificationListDTO } from "@/features/notification/application/dto/notification.dto";
import {
  listNotificationsSchema,
  markNotificationsReadSchema,
} from "@/features/notification/interface/schemas/notification.schema";
import { userAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import type { ActionResponse as ActionResponseType } from "@/shared/infrastructure/http/api-response";

type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;

const listNotificationsServerFn = createServerFn({ method: "GET" })
  .validator(listNotificationsSchema)
  .handler(async ({ data }) =>
    userAction(async (user) =>
      container.getNotificationController().listNotifications(user.id, data),
    ),
  );

const markNotificationsReadServerFn = createServerFn({ method: "POST" })
  .validator(markNotificationsReadSchema)
  .handler(async ({ data }) =>
    userAction(async (user) =>
      container.getNotificationController().markRead(user.id, data.ids),
    ),
  );

const markAllNotificationsReadServerFn = createServerFn({
  method: "POST",
}).handler(async () =>
  userAction(async (user) =>
    container.getNotificationController().markAllRead(user.id),
  ),
);

export async function listNotificationsAction(data: ListNotificationsInput) {
  return listNotificationsServerFn({ data }) as Promise<
    ActionResponseType<NotificationListDTO>
  >;
}

export async function markNotificationsReadAction(
  data: MarkNotificationsReadInput,
) {
  return markNotificationsReadServerFn({ data }) as Promise<
    ActionResponseType<{ ids: string[] }>
  >;
}

export async function markAllNotificationsReadAction() {
  return markAllNotificationsReadServerFn() as Promise<
    ActionResponseType<{ count: number }>
  >;
}
