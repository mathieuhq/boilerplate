import { useCallback, useState } from "react";
import { format } from "date-fns";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { NotificationDTO } from "@/features/notification/application/dto/notification.dto";
import { useNotifications } from "@/hooks/use-notifications";
import { useTranslations } from "@/i18n";
import type { TranslationFn } from "@/i18n/translator";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const UNRESOLVED_PLACEHOLDER = /\{\w+\}/;
const LOAD_MORE_MARGIN = "120px";

function translateNotification(
  t: TranslationFn,
  notification: NotificationDTO,
) {
  const titleKey = `types.${notification.type}.title`;
  const bodyKey = `types.${notification.type}.body`;
  const title = t(titleKey, notification.data);
  const body = t(bodyKey, notification.data);

  return {
    title: title.endsWith(titleKey) ? t("fallbackTitle") : title,
    body:
      body.endsWith(bodyKey) || UNRESOLVED_PLACEHOLDER.test(body) ? null : body,
  };
}

export const NotificationBell = () => {
  const t = useTranslations("notifications");

  const router = useRouter();

  const [open, setOpen] = useState(false);

  const onNotification = useCallback(
    (notification: NotificationDTO) => {
      const { title, body } = translateNotification(t, notification);

      const link = notification.link;

      toast(title, {
        description: body ?? undefined,
        action: link
          ? { label: t("open"), onClick: () => router.push(link) }
          : undefined,
      });
    },
    [router, t],
  );

  const {
    isError,
    markRead,
    isLoading,
    markAllRead,
    hasNextPage,
    unreadCount,
    notifications,
    fetchNextPage,
    isFetchingNextPage,
  } = useNotifications({ onNotification });

  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting))
            fetchNextPage().catch(() => undefined);
        },
        { rootMargin: LOAD_MORE_MARGIN },
      );

      observer.observe(node);

      return () => observer.disconnect();
    },
    [fetchNextPage],
  );

  const openNotification = (notification: NotificationDTO) => {
    if (!notification.readAt) markRead(notification.id);

    if (!notification.link) return;

    setOpen(false);

    router.push(notification.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-[1.2rem]" />
          <AnimatePresence initial={false}>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={cn(
                  "absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center",
                  "rounded-full bg-red-500 px-1 text-[10px] leading-none font-semibold text-white tabular-nums ring-2 ring-background",
                )}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
          <span className="sr-only">
            {unreadCount > 0 ? t("unread", { count: unreadCount }) : t("title")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <p className="text-sm font-semibold">{t("title")}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={markAllRead}
            className="h-7 px-2 text-xs"
            disabled={unreadCount === 0}
          >
            {t("markAllRead")}
          </Button>
        </div>
        <Separator />
        {isLoading || isError || notifications.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            {isLoading ? t("loading") : isError ? t("loadError") : t("empty")}
          </p>
        ) : (
          <ScrollArea className="[&>[data-slot=scroll-area-viewport]]:max-h-96">
            <ul className="divide-y">
              {notifications.map((notification) => {
                const { title, body } = translateNotification(t, notification);

                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={cn(
                        "hover:bg-accent active:bg-accent flex w-full gap-3 px-4 py-3 text-left transition-colors duration-150",
                        "focus-visible:bg-accent outline-none",
                      )}
                    >
                      {!notification.readAt && (
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-baseline justify-between gap-2">
                          <span
                            className={cn(
                              "min-w-0 text-sm",
                              !notification.readAt && "font-medium",
                            )}
                          >
                            {title}
                          </span>
                          <time
                            dateTime={notification.createdAt}
                            className="shrink-0 text-xs text-muted-foreground tabular-nums"
                          >
                            {format(
                              new Date(notification.createdAt),
                              "dd/MM/yy",
                            )}
                          </time>
                        </span>
                        {body && (
                          <span className="line-clamp-2 text-xs text-muted-foreground">
                            {body}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {isFetchingNextPage ? (
              <p className="border-t py-3 text-center text-xs text-muted-foreground">
                {t("loading")}
              </p>
            ) : (
              hasNextPage && <div ref={loadMoreRef} className="h-px" />
            )}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};
