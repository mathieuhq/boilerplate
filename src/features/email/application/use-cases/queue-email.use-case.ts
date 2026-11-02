import type { IJobQueuePort } from "@/shared/application/ports/job-queue.port";
import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import type { SendEmailDTO } from "../dto/send-email.dto";
import type { EmailJobs } from "../jobs/email.jobs";
import { renderEmailHtml } from "../services/render-email-html";

type QueueEmailOutput = {
  queued: true;
};

export class QueueEmailUseCase implements IUseCase<
  SendEmailDTO,
  QueueEmailOutput
> {
  constructor(private readonly jobQueue: IJobQueuePort<EmailJobs>) {}

  async execute(input: SendEmailDTO): Promise<Result<QueueEmailOutput>> {
    await this.jobQueue.enqueue({
      name: "email.send",
      payload: {
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        text: input.text,
        from: input.from,
        subject: input.subject,
        replyTo: input.replyTo,
        html: await renderEmailHtml(input.html),
        attachments: input.attachments?.map((attachment) => ({
          ...attachment,
          content:
            attachment.content instanceof Buffer
              ? attachment.content.toString("base64")
              : attachment.content,
        })),
      },
    });

    return Result.ok({ queued: true });
  }
}
