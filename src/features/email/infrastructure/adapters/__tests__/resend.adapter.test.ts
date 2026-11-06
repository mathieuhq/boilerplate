import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResendAdapter } from "../resend.adapter";

const client = vi.hoisted(() => ({
  emails: { send: vi.fn() },
  contacts: {
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    segments: { add: vi.fn() },
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn(function Resend() {
    return client;
  }),
}));

const config = {
  from: "hello@example.com",
  apiKey: "re_test",
};

const resendError = {
  message: "Invalid from address",
  statusCode: 422,
  name: "validation_error",
};

describe("ResendAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends email through Resend", async () => {
    client.emails.send.mockResolvedValue({
      data: { id: "email-123" },
      error: null,
    });

    const result = await new ResendAdapter(config).send({
      html: "<p>Hello</p>",
      text: "Hello",
      subject: "Welcome",
      to: "user@example.com",
      cc: "cc@example.com",
      bcc: ["bcc@example.com"],
      replyTo: "reply@example.com",
      attachments: [{ filename: "a.txt", content: "YQ==" }],
    });

    expect(result).toEqual({ error: null, data: "email-123" });
    expect(client.emails.send).toHaveBeenCalledWith({
      html: "<p>Hello</p>",
      text: "Hello",
      subject: "Welcome",
      to: "user@example.com",
      cc: "cc@example.com",
      bcc: ["bcc@example.com"],
      replyTo: "reply@example.com",
      from: "hello@example.com",
      attachments: [{ filename: "a.txt", content: "YQ==" }],
    });
  });

  it("uses the given sender over the default one", async () => {
    client.emails.send.mockResolvedValue({ data: { id: "1" }, error: null });

    await new ResendAdapter(config).send({
      html: "<p>Hi</p>",
      subject: "Hi",
      to: "user@example.com",
      from: "other@example.com",
    });

    expect(client.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "other@example.com" }),
    );
  });

  it("returns Resend API errors", async () => {
    client.emails.send.mockResolvedValue({ data: null, error: resendError });

    const result = await new ResendAdapter(config).send({
      html: "<p>Hi</p>",
      subject: "Hi",
      to: "user@example.com",
    });

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("Invalid from address");
  });

  it("returns thrown errors", async () => {
    client.emails.send.mockRejectedValueOnce(new Error("network down"));
    client.emails.send.mockRejectedValueOnce("boom");
    const adapter = new ResendAdapter(config);
    const params = { html: "<p>Hi</p>", subject: "Hi", to: "u@example.com" };

    expect((await adapter.send(params)).error?.message).toBe("network down");
    expect((await adapter.send(params)).error?.message).toBe("boom");
  });

  it("ignores contacts without an email", async () => {
    expect(
      await new ResendAdapter(config).subscribeContact({ email: "" }),
    ).toBeUndefined();
    expect(client.contacts.create).not.toHaveBeenCalled();
  });

  it("creates subscribed contacts in the configured segment", async () => {
    client.contacts.create.mockResolvedValue({
      data: { id: "contact-1" },
      error: null,
    });

    const contactId = await new ResendAdapter({
      ...config,
      contactListId: "segment-1",
    }).subscribeContact({ email: "user@example.com", name: "Ada" });

    expect(contactId).toBe("contact-1");
    expect(client.contacts.create).toHaveBeenCalledWith({
      email: "user@example.com",
      firstName: "Ada",
      unsubscribed: false,
      segments: [{ id: "segment-1" }],
    });
  });

  it("resubscribes an existing contact and adds it to the segment", async () => {
    client.contacts.create.mockResolvedValue({
      data: null,
      error: resendError,
    });
    client.contacts.update.mockResolvedValue({
      data: { id: "contact-1" },
      error: null,
    });
    client.contacts.segments.add.mockResolvedValue({
      data: { id: "segment-1" },
      error: null,
    });

    const contactId = await new ResendAdapter({
      ...config,
      contactListId: "segment-1",
    }).subscribeContact({ email: "user@example.com" });

    expect(contactId).toBe("contact-1");
    expect(client.contacts.update).toHaveBeenCalledWith({
      email: "user@example.com",
      unsubscribed: false,
    });
    expect(client.contacts.segments.add).toHaveBeenCalledWith({
      contactId: "contact-1",
      segmentId: "segment-1",
    });
  });

  it("resubscribes without a segment", async () => {
    client.contacts.create.mockResolvedValue({
      data: null,
      error: resendError,
    });
    client.contacts.update.mockResolvedValue({
      data: { id: "contact-1" },
      error: null,
    });

    expect(
      await new ResendAdapter(config).subscribeContact({
        email: "user@example.com",
      }),
    ).toBe("contact-1");
    expect(client.contacts.create).toHaveBeenCalledWith(
      expect.objectContaining({ segments: undefined }),
    );
    expect(client.contacts.segments.add).not.toHaveBeenCalled();
  });

  it("returns undefined when the contact cannot be created or updated", async () => {
    client.contacts.create.mockResolvedValue({
      data: null,
      error: resendError,
    });
    client.contacts.update.mockResolvedValue({
      data: null,
      error: resendError,
    });

    expect(
      await new ResendAdapter(config).subscribeContact({
        email: "user@example.com",
      }),
    ).toBeUndefined();
  });

  it("unsubscribes contacts by id", async () => {
    client.contacts.update.mockResolvedValueOnce({
      data: { id: "contact-1" },
      error: null,
    });
    client.contacts.update.mockResolvedValueOnce({
      data: null,
      error: resendError,
    });
    const adapter = new ResendAdapter(config);

    expect(await adapter.unsubscribeContact("contact-1")).toBe("contact-1");
    expect(client.contacts.update).toHaveBeenCalledWith({
      id: "contact-1",
      unsubscribed: true,
    });
    expect(await adapter.unsubscribeContact("contact-1")).toBeUndefined();
  });

  it("deletes contacts by id", async () => {
    client.contacts.remove.mockResolvedValueOnce({
      data: { deleted: true },
      error: null,
    });
    client.contacts.remove.mockResolvedValueOnce({
      data: null,
      error: resendError,
    });
    const adapter = new ResendAdapter(config);

    expect(await adapter.deleteContact("contact-1")).toBe(true);
    expect(client.contacts.remove).toHaveBeenCalledWith("contact-1");
    expect(await adapter.deleteContact("contact-1")).toBe(false);
  });
});
