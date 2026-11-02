import { describe, expect, it, vi } from "vitest";

import type { IJobQueuePort } from "@/shared/application/ports/job-queue.port";

import { InvalidNotificationLinkError } from "../../domain/errors/invalid-notification-link.error";
import type { SendNotificationDTO } from "../dto/send-notification.dto";
import type { NotificationJobs } from "../jobs/notification.jobs";
import { SendNotificationUseCase } from "../use-cases/send-notification.use-case";

const createUseCase = () => {
  const jobQueue: IJobQueuePort<
    Pick<NotificationJobs, "notification.dispatch">
  > = { enqueue: vi.fn().mockResolvedValue(undefined) };

  return { jobQueue, useCase: new SendNotificationUseCase(jobQueue) };
};

const input: SendNotificationDTO = {
  audience: { kind: "users", userIds: ["user-1"] },
  type: "system.message",
  data: { title: "Export ready" },
  link: "/settings",
};

describe("SendNotificationUseCase", () => {
  it("queues the notification for dispatch", async () => {
    const { jobQueue, useCase } = createUseCase();

    const result = await useCase.execute(input);

    expect(result.value).toEqual({ queued: true });
    expect(jobQueue.enqueue).toHaveBeenCalledWith({
      name: "notification.dispatch",
      payload: input,
    });
  });

  it("queues notifications without a link", async () => {
    const { jobQueue, useCase } = createUseCase();
    const { link: _link, ...withoutLink } = input;

    const result = await useCase.execute(withoutLink);

    expect(result.isSuccess).toBe(true);
    expect(jobQueue.enqueue).toHaveBeenCalledWith({
      name: "notification.dispatch",
      payload: withoutLink,
    });
  });

  it("rejects links that leave the app", async () => {
    const { jobQueue, useCase } = createUseCase();

    const result = await useCase.execute({
      ...input,
      link: "https://evil.example.com",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidNotificationLinkError);
    expect(jobQueue.enqueue).not.toHaveBeenCalled();
  });
});
