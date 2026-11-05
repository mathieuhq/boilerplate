import { createFileRoute } from "@tanstack/react-router";

import type { NotificationEvent } from "@/features/notification/application/ports/notification-publisher.port";
import { authRoute } from "@/lib/zod-route";
import { container } from "@/shared/infrastructure/di/container";

const HEARTBEAT_INTERVAL_MS = 25_000;
const RECONNECT_DELAY_MS = 5_000;

export const Route = createFileRoute("/api/v1/private/notifications/stream")({
  server: {
    handlers: {
      GET: authRoute.handler(({ request, ctx }) => {
        const notificationController = container.getNotificationController();
        const encoder = new TextEncoder();
        let cleanup: (() => void) | undefined;

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            let closed = false;

            const write = (chunk: string) => {
              if (!closed) controller.enqueue(encoder.encode(chunk));
            };

            const unsubscribe = notificationController.subscribe(
              ctx.user.id,
              (event: NotificationEvent) =>
                write(`data: ${JSON.stringify(event)}\n\n`),
            );
            const heartbeat = setInterval(
              () => write(": ping\n\n"),
              HEARTBEAT_INTERVAL_MS,
            );

            const stop = () => {
              if (closed) return;

              closed = true;
              clearInterval(heartbeat);
              unsubscribe();
            };

            cleanup = stop;

            request.signal.addEventListener(
              "abort",
              () => {
                if (closed) return;

                stop();
                controller.close();
              },
              { once: true },
            );

            write(`retry: ${RECONNECT_DELAY_MS}\n\n`);
          },
          cancel() {
            cleanup?.();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      }),
    },
  },
});
