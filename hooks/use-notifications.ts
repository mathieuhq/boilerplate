import { useEffect, useRef } from "react";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import type {
  NotificationDTO,
  NotificationListDTO,
} from "@/features/notification/application/dto/notification.dto";
import type { NotificationEvent } from "@/features/notification/application/ports/notification-publisher.port";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import {
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationsReadAction,
} from "@/server-functions/notification.functions";

const NOTIFICATIONS_QUERY_KEY = ["notifications"];
const NOTIFICATIONS_STREAM_URL = "/api/notifications/stream";
const PAGE_SIZE = 25;

type NotificationPages = InfiniteData<NotificationListDTO, string | undefined>;

type UseNotificationsOptions = {
  onNotification?: (notification: NotificationDTO) => void;
};

function prependNotification(
  data: NotificationPages | undefined,
  notification: NotificationDTO,
) {
  if (!data || data.pages.length === 0) return data;

  const [firstPage, ...otherPages] = data.pages;

  const exists = data.pages.some((page) =>
    page.items.some((item) => item.id === notification.id),
  );

  if (exists) return data;

  return {
    ...data,
    pages: [
      {
        ...firstPage,
        items: [notification, ...firstPage.items],
        unreadCount: firstPage.unreadCount + 1,
      },
      ...otherPages,
    ],
  };
}

function markAsRead(
  data: NotificationPages | undefined,
  ids: string[] | "all",
) {
  if (!data) return data;

  const readAt = new Date().toISOString();
  let marked = 0;

  const pages = data.pages.map((page) => ({
    ...page,
    items: page.items.map((item) => {
      if (item.readAt || (ids !== "all" && !ids.includes(item.id))) return item;

      marked += 1;

      return { ...item, readAt };
    }),
  }));

  return {
    ...data,
    pages: pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            unreadCount:
              ids === "all" ? 0 : Math.max(0, page.unreadCount - marked),
          }
        : page,
    ),
  };
}

export const useNotifications = ({
  onNotification,
}: UseNotificationsOptions = {}) => {
  const queryClient = useQueryClient();
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  const query = useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrapActionData(
        await listNotificationsAction({ limit: PAGE_SIZE, cursor: pageParam }),
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  useEffect(() => {
    const source = new EventSource(NOTIFICATIONS_STREAM_URL);
    let hasConnected = false;

    const update = (
      updater: (data: NotificationPages | undefined) => unknown,
    ) =>
      queryClient.setQueryData<NotificationPages>(
        NOTIFICATIONS_QUERY_KEY,
        (data) => updater(data) as NotificationPages | undefined,
      );

    source.addEventListener("open", () => {
      if (hasConnected)
        queryClient
          .invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
          .catch(() => undefined);

      hasConnected = true;
    });

    source.addEventListener("message", (message: MessageEvent<string>) => {
      const event = JSON.parse(message.data) as NotificationEvent;

      if (event.type === "notification.created") {
        update((data) => prependNotification(data, event.notification));
        onNotificationRef.current?.(event.notification);
        return;
      }

      update((data) =>
        markAsRead(
          data,
          event.type === "notification.read" ? event.ids : "all",
        ),
      );
    });

    return () => source.close();
  }, [queryClient]);

  const resync = async () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

  const markReadMutation = useMutation({
    mutationFn: async (ids: string[]) =>
      unwrapActionData(await markNotificationsReadAction({ ids })),
    onMutate: (ids) =>
      queryClient.setQueryData<NotificationPages>(
        NOTIFICATIONS_QUERY_KEY,
        (data) => markAsRead(data, ids),
      ),
    onError: resync,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () =>
      unwrapActionData(await markAllNotificationsReadAction()),
    onMutate: () =>
      queryClient.setQueryData<NotificationPages>(
        NOTIFICATIONS_QUERY_KEY,
        (data) => markAsRead(data, "all"),
      ),
    onError: resync,
  });

  const pages = query.data?.pages ?? [];

  return {
    notifications: pages.flatMap((page) => page.items),
    unreadCount: pages[0]?.unreadCount ?? 0,
    isLoading: query.isPending,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    markRead: (id: string) => markReadMutation.mutate([id]),
    markAllRead: () => markAllReadMutation.mutate(),
  };
};
