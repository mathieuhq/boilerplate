import type { IJobQueuePort } from "@/shared/application/ports/job-queue.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { InvalidNotificationLinkError } from "../../domain/errors/invalid-notification-link.error";
import { isSafeNotificationLink } from "../../domain/notification-link";
import type { SendNotificationDTO } from "../dto/send-notification.dto";
import type { NotificationJobs } from "../jobs/notification.jobs";

type SendNotificationOutput = {
  queued: true;
};

export class SendNotificationUseCase implements IUseCase<
  SendNotificationDTO,
  SendNotificationOutput
> {
  constructor(
    private readonly jobQueue: IJobQueuePort<
      Pick<NotificationJobs, "notification.dispatch">
    >,
  ) {}

  async execute(
    input: SendNotificationDTO,
  ): Promise<Result<SendNotificationOutput>> {
    if (input.link !== undefined && !isSafeNotificationLink(input.link))
      return Result.fail(new InvalidNotificationLinkError(input.link));

    await this.jobQueue.enqueue({
      name: "notification.dispatch",
      payload: input,
    });

    return Result.ok({ queued: true });
  }
}
