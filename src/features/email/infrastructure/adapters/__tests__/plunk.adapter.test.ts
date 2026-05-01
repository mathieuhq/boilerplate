import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PlunkAdapter } from "../plunk.adapter";

const config = {
  from: "hello@example.com",
  apiKey: "sk_test",
  baseUrl: "https://next-api.useplunk.com",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function getRequestBody(call: unknown[]) {
  const init = call[1] as RequestInit;
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

describe("PlunkAdapter", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends transactional email through Plunk", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          emails: [
            {
              email: "email-123",
            },
          ],
        },
      }),
    );

    const adapter = new PlunkAdapter(config);
    const result = await adapter.send({
      html: "<p>Hello</p>",
      subject: "Welcome",
      to: "user@example.com",
      replyTo: "reply@example.com",
    });

    expect(result).toEqual({
      error: null,
      data: "email-123",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://next-api.useplunk.com/v1/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test",
          "Content-Type": "application/json",
        }),
      }),
    );
    expect(getRequestBody(fetchMock.mock.calls[0])).toEqual({
      to: "user@example.com",
      body: "<p>Hello</p>",
      from: "hello@example.com",
      reply: "reply@example.com",
      subject: "Welcome",
    });
  });

  it("returns Plunk API errors", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          message: "Invalid sender",
        },
        400,
      ),
    );

    const adapter = new PlunkAdapter(config);
    const result = await adapter.send({
      html: "<p>Hello</p>",
      subject: "Welcome",
      to: "user@example.com",
    });

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe("Invalid sender");
  });

  it("returns an error for malformed send responses", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        success: true,
        data: {
          emails: [],
        },
      }),
    );

    const adapter = new PlunkAdapter(config);
    const result = await adapter.send({
      html: "<p>Hello</p>",
      subject: "Welcome",
      to: "user@example.com",
    });

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe(
      "Plunk send response did not include an email id.",
    );
  });

  it("rejects cc and bcc because Plunk does not document them", async () => {
    const adapter = new PlunkAdapter(config);

    const result = await adapter.send({
      html: "<p>Hello</p>",
      subject: "Welcome",
      to: "user@example.com",
      cc: "copy@example.com",
    });

    expect(result.data).toBeNull();
    expect(result.error?.message).toBe(
      "PlunkAdapter does not support cc or bcc recipients.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("subscribes contacts and adds them to a configured segment", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            contact: "contact-123",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
        }),
      );

    const adapter = new PlunkAdapter({
      ...config,
      contactListId: "segment-123",
    });
    const result = await adapter.subscribeContact({
      email: "user@example.com",
      name: "User Name",
    });

    expect(result).toBe("contact-123");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://next-api.useplunk.com/v1/track",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(getRequestBody(fetchMock.mock.calls[0])).toEqual({
      email: "user@example.com",
      event: "contact_subscribed",
      subscribed: true,
      data: {
        name: "User Name",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://next-api.useplunk.com/segments/segment-123/members",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(getRequestBody(fetchMock.mock.calls[1])).toEqual({
      emails: ["user@example.com"],
    });
  });

  it("unsubscribes contacts by id", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: "contact-123",
        email: "user@example.com",
        subscribed: false,
      }),
    );

    const adapter = new PlunkAdapter(config);
    const result = await adapter.unsubscribeContact("contact-123");

    expect(result).toBe("contact-123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://next-api.useplunk.com/contacts/contact-123",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(getRequestBody(fetchMock.mock.calls[0])).toEqual({
      subscribed: false,
    });
  });
});
