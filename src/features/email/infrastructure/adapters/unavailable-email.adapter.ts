import type {
  ContactInfo,
  IEmailProviderPort,
  SendEmailParams,
  SendEmailResult,
} from "../../application/ports/email-provider.port";

const EMAIL_NOT_CONFIGURED = "EMAIL_NOT_CONFIGURED";

export class UnavailableEmailAdapter implements IEmailProviderPort {
  async send(_params: SendEmailParams): Promise<SendEmailResult> {
    return {
      data: null,
      error: new Error(EMAIL_NOT_CONFIGURED),
    };
  }

  async subscribeContact(
    _contact: ContactInfo,
  ): Promise<string | undefined> {
    return;
  }

  async unsubscribeContact(
    _contactId: string,
  ): Promise<string | undefined> {
    return;
  }
}
