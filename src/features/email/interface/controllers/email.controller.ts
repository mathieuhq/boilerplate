import { EmailDeliveryError } from "../../application/errors/email-delivery.error";
import type { EmailJobs } from "../../application/jobs/email.jobs";
import type { DeleteContactUseCase } from "../../application/use-cases/delete-contact.use-case";
import type { QueueEmailUseCase } from "../../application/use-cases/queue-email.use-case";
import type { SendEmailUseCase } from "../../application/use-cases/send-email.use-case";
import type { SubscribeContactUseCase } from "../../application/use-cases/subscribe-contact.use-case";
import type { UnsubscribeContactUseCase } from "../../application/use-cases/unsubscribe-contact.use-case";
import type { Attachment } from "../../domain/entities/email-message.entity";

export class EmailController {
  constructor(
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly queueEmailUseCase: QueueEmailUseCase,
    private readonly subscribeContactUseCase: SubscribeContactUseCase,
    private readonly unsubscribeContactUseCase: UnsubscribeContactUseCase,
    private readonly deleteContactUseCase: DeleteContactUseCase,
  ) {}

  async sendEmail(params: {
    to: string | string[];
    subject: string;
    html: string | React.ReactElement;
    from?: string;
    text?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Attachment[];
  }) {
    const result = await this.sendEmailUseCase.execute(params);

    return result.unwrap();
  }

  async queueEmail(params: Parameters<EmailController["sendEmail"]>[0]) {
    const result = await this.queueEmailUseCase.execute(params);

    return result.unwrap();
  }

  async deliverQueuedEmail(payload: EmailJobs["email.send"]) {
    const result = await this.sendEmailUseCase.execute(payload);
    const delivery = result.unwrap();

    if (!delivery.success) throw new EmailDeliveryError(delivery.error);

    return delivery;
  }

  async subscribeContact(params: { email: string; name?: string }) {
    const result = await this.subscribeContactUseCase.execute(params);

    return result.unwrap();
  }

  async unsubscribeContact(contactId: string) {
    const result = await this.unsubscribeContactUseCase.execute({ contactId });

    return result.unwrap();
  }

  async deleteContact(contactId: string) {
    const result = await this.deleteContactUseCase.execute({ contactId });

    return result.unwrap();
  }
}
