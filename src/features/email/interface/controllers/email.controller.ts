import type { SendEmailUseCase } from "../../application/use-cases/send-email.use-case";
import type { SubscribeContactUseCase } from "../../application/use-cases/subscribe-contact.use-case";
import type { UnsubscribeContactUseCase } from "../../application/use-cases/unsubscribe-contact.use-case";
import type { Attachment } from "../../domain/entities/email-message.entity";

export class EmailController {
  constructor(
    private readonly sendEmailUseCase: SendEmailUseCase,
    private readonly subscribeContactUseCase: SubscribeContactUseCase,
    private readonly unsubscribeContactUseCase: UnsubscribeContactUseCase,
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

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async subscribeContact(params: { email: string; name?: string }) {
    const result = await this.subscribeContactUseCase.execute(params);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async unsubscribeContact(contactId: string) {
    const result = await this.unsubscribeContactUseCase.execute({ contactId });

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
