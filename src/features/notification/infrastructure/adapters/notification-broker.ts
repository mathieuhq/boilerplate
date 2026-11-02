import type {
  INotificationPublisherPort,
  INotificationStreamPort,
  NotificationEvent,
  NotificationListener,
} from "../../application/ports/notification-publisher.port";

type ErrorReporter = (
  message: string,
  details: Record<string, unknown>,
) => void;

export type NotificationBroker = INotificationPublisherPort &
  INotificationStreamPort;

type RedisPublisher = {
  publish: (channel: string, message: string) => Promise<unknown>;
};

type RedisSubscriber = {
  subscribe: (channel: string) => Promise<unknown>;
  on: (
    event: "message",
    handler: (channel: string, message: string) => void,
  ) => unknown;
};

class NotificationListenerRegistry {
  private readonly listeners = new Map<string, Set<NotificationListener>>();

  constructor(private readonly onError: ErrorReporter) {}

  add(userId: string, listener: NotificationListener) {
    const listeners = this.listeners.get(userId) ?? new Set();

    listeners.add(listener);
    this.listeners.set(userId, listeners);

    return () => {
      listeners.delete(listener);

      if (listeners.size === 0) this.listeners.delete(userId);
    };
  }

  emit(userId: string, event: NotificationEvent) {
    for (const listener of this.listeners.get(userId) ?? []) {
      try {
        listener(event);
      } catch (error) {
        this.onError("Notification listener failed", { error, userId });
      }
    }
  }
}

export class InMemoryNotificationBroker implements NotificationBroker {
  private readonly listeners: NotificationListenerRegistry;

  constructor(onError: ErrorReporter) {
    this.listeners = new NotificationListenerRegistry(onError);
  }

  async publish(userId: string, event: NotificationEvent): Promise<void> {
    this.listeners.emit(userId, event);
  }

  subscribe(userId: string, listener: NotificationListener) {
    return this.listeners.add(userId, listener);
  }
}

export class RedisNotificationBroker implements NotificationBroker {
  private readonly listeners: NotificationListenerRegistry;
  private subscribed = false;

  constructor(
    private readonly publisher: RedisPublisher,
    private readonly createSubscriber: () => RedisSubscriber,
    private readonly channel: string,
    private readonly onError: ErrorReporter,
  ) {
    this.listeners = new NotificationListenerRegistry(onError);
  }

  async publish(userId: string, event: NotificationEvent): Promise<void> {
    try {
      await this.publisher.publish(
        this.channel,
        JSON.stringify({ userId, event }),
      );
    } catch (error) {
      this.onError("Failed to publish notification event", { error, userId });
    }
  }

  subscribe(userId: string, listener: NotificationListener) {
    this.ensureSubscribed();

    return this.listeners.add(userId, listener);
  }

  private ensureSubscribed() {
    if (this.subscribed) return;

    this.subscribed = true;

    const subscriber = this.createSubscriber();

    subscriber.on("message", (channel, message) => {
      if (channel === this.channel) this.handleMessage(message);
    });

    subscriber.subscribe(this.channel).catch((error: unknown) => {
      this.onError("Failed to subscribe to notification events", { error });
    });
  }

  private handleMessage(message: string) {
    try {
      const { userId, event } = JSON.parse(message) as {
        userId: string;
        event: NotificationEvent;
      };

      this.listeners.emit(userId, event);
    } catch (error) {
      this.onError("Invalid notification event message", { error });
    }
  }
}
