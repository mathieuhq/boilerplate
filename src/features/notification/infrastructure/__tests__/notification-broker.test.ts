import { describe, expect, it, vi } from "vitest";

import type { NotificationEvent } from "../../application/ports/notification-publisher.port";
import {
  InMemoryNotificationBroker,
  RedisNotificationBroker,
} from "../adapters/notification-broker";

const event: NotificationEvent = { type: "notification.read-all" };
const CHANNEL = "@app/notifications";

const createRedisBroker = () => {
  let handler: ((channel: string, message: string) => void) | undefined;
  const publisher = { publish: vi.fn().mockResolvedValue(1) };
  const subscriber = {
    subscribe: vi.fn().mockResolvedValue(1),
    on: vi.fn(
      (_event: "message", next: (channel: string, message: string) => void) => {
        handler = next;
      },
    ),
  };
  const createSubscriber = vi.fn(() => subscriber);
  const onError = vi.fn();
  const broker = new RedisNotificationBroker(
    publisher,
    createSubscriber,
    CHANNEL,
    onError,
  );

  return {
    broker,
    publisher,
    subscriber,
    createSubscriber,
    onError,
    receive: (channel: string, message: string) => handler?.(channel, message),
  };
};

describe("InMemoryNotificationBroker", () => {
  it("delivers events only to the subscribed user until unsubscribed", async () => {
    const broker = new InMemoryNotificationBroker(vi.fn());
    const listener = vi.fn();
    const otherListener = vi.fn();
    const unsubscribe = broker.subscribe("user-1", listener);
    broker.subscribe("user-2", otherListener);

    await broker.publish("user-1", event);
    unsubscribe();
    await broker.publish("user-1", event);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(event);
    expect(otherListener).not.toHaveBeenCalled();
  });

  it("keeps notifying other listeners when one throws", async () => {
    const onError = vi.fn();
    const broker = new InMemoryNotificationBroker(onError);
    const listener = vi.fn();
    broker.subscribe("user-1", () => {
      throw new Error("closed");
    });
    broker.subscribe("user-1", listener);

    await broker.publish("user-1", event);

    expect(listener).toHaveBeenCalledWith(event);
    expect(onError).toHaveBeenCalledWith(
      "Notification listener failed",
      expect.objectContaining({ userId: "user-1" }),
    );
  });
});

describe("RedisNotificationBroker", () => {
  it("publishes events on the shared channel", async () => {
    const { broker, publisher } = createRedisBroker();

    await broker.publish("user-1", event);

    expect(publisher.publish).toHaveBeenCalledWith(
      CHANNEL,
      JSON.stringify({ userId: "user-1", event }),
    );
  });

  it("reports publish failures instead of throwing", async () => {
    const { broker, publisher, onError } = createRedisBroker();
    publisher.publish.mockRejectedValue(new Error("down"));

    await expect(broker.publish("user-1", event)).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith(
      "Failed to publish notification event",
      expect.objectContaining({ userId: "user-1" }),
    );
  });

  it("subscribes once and routes channel messages to local listeners", () => {
    const { broker, subscriber, createSubscriber, receive } =
      createRedisBroker();
    const listener = vi.fn();
    const otherListener = vi.fn();

    broker.subscribe("user-1", listener);
    broker.subscribe("user-2", otherListener);
    receive(CHANNEL, JSON.stringify({ userId: "user-1", event }));
    receive("other", JSON.stringify({ userId: "user-1", event }));

    expect(createSubscriber).toHaveBeenCalledTimes(1);
    expect(subscriber.subscribe).toHaveBeenCalledWith(CHANNEL);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(event);
    expect(otherListener).not.toHaveBeenCalled();
  });

  it("reports invalid messages and subscription failures", async () => {
    const { broker, subscriber, onError, receive } = createRedisBroker();
    subscriber.subscribe.mockRejectedValue(new Error("down"));

    broker.subscribe("user-1", vi.fn());
    receive(CHANNEL, "not json");
    await vi.waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        "Failed to subscribe to notification events",
        expect.any(Object),
      ),
    );

    expect(onError).toHaveBeenCalledWith(
      "Invalid notification event message",
      expect.any(Object),
    );
  });
});
