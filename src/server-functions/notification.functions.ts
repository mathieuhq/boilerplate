import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { NotificationListDTO } from "@/features/notification/application/dto/notification.dto";
import {
  listNotificationsSchema,
  markNotificationsReadSchema,
} from "@/features/notification/interface/schemas/notification.schema";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;

const listNotificationsServerFn = createServerFn({ method: "GET" })
  .validator(listNotificationsSchema)
  .handler(async ({ data }) => {
    try {
      const user = await getRequiredActionUser();
      const notifications = await container
        .getNotificationController()
        .listNotifications(user.id, data);

      return ActionResponse.success(notifications);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

const markNotificationsReadServerFn = createServerFn({ method: "POST" })
  .validator(markNotificationsReadSchema)
  .handler(async ({ data }) => {
    try {
      const user = await getRequiredActionUser();
      const result = await container
        .getNotificationController()
        .markRead(user.id, data.ids);

      return ActionResponse.success(result);
    } catch (error) {
      return actionErrorResponse(error);
    }
  });

const markAllNotificationsReadServerFn = createServerFn({
  method: "POST",
}).handler(async () => {
  try {
    const user = await getRequiredActionUser();
    const result = await container
      .getNotificationController()
      .markAllRead(user.id);

    return ActionResponse.success(result);
  } catch (error) {
    return actionErrorResponse(error);
  }
});

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
