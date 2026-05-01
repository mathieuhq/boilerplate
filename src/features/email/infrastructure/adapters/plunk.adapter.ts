import type {
  ContactInfo,
  IEmailProviderPort,
  SendEmailParams,
  SendEmailResult,
} from "../../application/ports/email-provider.port";

type PlunkAdapterConfig = {
  from: string;
  apiKey: string;
  baseUrl: string;
  contactListId?: string;
};

type PlunkSendResponse = {
  success?: boolean;
  data?: {
    emails?: {
      email?: string;
    }[];
  };
};

type PlunkTrackResponse = {
  success?: boolean;
  data?: {
    contact?: string;
  };
};

type PlunkContactResponse = {
  id?: string;
  contact?: string;
  success?: boolean;
};

type RequestResult<T> = { data: T; error: null } | { data: null; error: Error };

const CONTACT_SUBSCRIBED_EVENT = "contact_subscribed";
const CC_BCC_UNSUPPORTED =
  "PlunkAdapter does not support cc or bcc recipients.";

export class PlunkAdapter implements IEmailProviderPort {
  private readonly from: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly contactListId?: string;

  constructor(config: PlunkAdapterConfig) {
    this.from = config.from;
    this.apiKey = config.apiKey;
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.contactListId = config.contactListId;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (params.cc || params.bcc)
      return {
        data: null,
        error: new Error(CC_BCC_UNSUPPORTED),
      };

    try {
      const attachments = mapAttachments(params.attachments);

      const result = await this.request<PlunkSendResponse>("POST", "/v1/send", {
        attachments,
        to: params.to,
        body: params.html,
        reply: params.replyTo,
        subject: params.subject,
        from: params.from ?? this.from,
      });

      if (result.error) return { data: null, error: result.error };

      const emailId = result.data.data?.emails?.[0]?.email;

      if (!emailId)
        return {
          data: null,
          error: new Error("Plunk send response did not include an email id."),
        };

      return {
        error: null,
        data: emailId,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error(String(error)),
        data: null,
      };
    }
  }

  async subscribeContact(contact: ContactInfo): Promise<string | undefined> {
    if (!contact.email) return;

    const result = await this.request<PlunkTrackResponse>("POST", "/v1/track", {
      subscribed: true,
      email: contact.email,
      event: CONTACT_SUBSCRIBED_EVENT,
      data: contact.name ? { name: contact.name } : undefined,
    });

    if (result.error) return;

    if (this.contactListId && !(await this.addContactToSegment(contact.email)))
      return;

    return result.data.data?.contact;
  }

  async unsubscribeContact(contactId: string): Promise<string | undefined> {
    const result = await this.request<PlunkContactResponse>(
      "PATCH",
      `/contacts/${encodeURIComponent(contactId)}`,
      {
        subscribed: false,
      },
    );

    if (result.error) return;

    return result.data.id ?? result.data.contact ?? contactId;
  }

  private async addContactToSegment(email: string) {
    if (!this.contactListId) return true;

    const result = await this.request<unknown>(
      "POST",
      `/segments/${encodeURIComponent(this.contactListId)}/members`,
      {
        emails: [email],
      },
    );

    return !result.error;
  }

  private async request<T>(
    method: "PATCH" | "POST",
    path: string,
    body: unknown,
  ): Promise<RequestResult<T>> {
    const response = await fetch(this.getUrl(path), {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(removeUndefinedValues(body)),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok)
      return {
        data: null,
        error: new Error(getPlunkErrorMessage(data, response.status)),
      };

    if (isRecord(data) && data.success === false)
      return {
        data: null,
        error: new Error(getPlunkErrorMessage(data, response.status)),
      };

    return {
      error: null,
      data: data as T,
    };
  }

  private getUrl(path: string) {
    return new URL(path.replace(/^\//, ""), `${this.baseUrl}/`).toString();
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function removeUndefinedValues(value: unknown): unknown {
  if (!isRecord(value)) return value;

  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getPlunkErrorMessage(data: unknown, status: number) {
  if (!isRecord(data)) return `Plunk request failed with status ${status}.`;

  if (typeof data.message === "string") return data.message;

  if (typeof data.error === "string") return data.error;

  if (isRecord(data.error) && typeof data.error.message === "string")
    return data.error.message;

  return `Plunk request failed with status ${status}.`;
}

function mapAttachments(attachments: SendEmailParams["attachments"]) {
  if (!attachments) return undefined;

  return attachments.map((attachment) => {
    if (!attachment.content)
      throw new Error(
        "PlunkAdapter requires attachment content to be provided.",
      );

    return {
      content:
        attachment.content instanceof Buffer
          ? attachment.content.toString("base64")
          : attachment.content,
      contentType: attachment.contentType,
      filename:
        typeof attachment.filename === "string"
          ? attachment.filename
          : undefined,
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
