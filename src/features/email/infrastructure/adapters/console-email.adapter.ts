import type {
  IEmailProviderPort,
  SendEmailParams,
  SendEmailResult,
} from "../../application/ports/email-provider.port";

type ConsoleEmailLog = (
  message: string,
  details: { to: string[]; subject: string; links: string[] },
) => void;

const extractLinks = (html: string) =>
  [...html.matchAll(/href="([^"]+)"/g)].map(([, href]) =>
    href.replaceAll("&amp;", "&"),
  );

export class ConsoleEmailAdapter implements IEmailProviderPort {
  constructor(private readonly log: ConsoleEmailLog) {}

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const id = `console-${crypto.randomUUID()}`;

    this.log("Email not sent (no provider configured)", {
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      links: extractLinks(params.html),
    });

    return { error: null, data: id };
  }
}
