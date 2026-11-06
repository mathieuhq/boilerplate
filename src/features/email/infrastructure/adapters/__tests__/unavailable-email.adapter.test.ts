import { describe, expect, it } from "vitest";

import { UnavailableEmailAdapter } from "../unavailable-email.adapter";

describe("UnavailableEmailAdapter", () => {
  it("returns EMAIL_NOT_CONFIGURED when sending email", async () => {
    const adapter = new UnavailableEmailAdapter();

    await expect(
      adapter.send({
        subject: "Test",
        html: "<p>Hello</p>",
        to: "user@example.com",
      }),
    ).resolves.toEqual({
      data: null,
      error: expect.objectContaining({
        message: "EMAIL_NOT_CONFIGURED",
      }),
    });
  });

  it("does not support contact subscriptions", async () => {
    const adapter = new UnavailableEmailAdapter();

    await expect(
      adapter.subscribeContact({ email: "user@example.com" }),
    ).resolves.toBeUndefined();
    await expect(
      adapter.unsubscribeContact("contact-id"),
    ).resolves.toBeUndefined();
    await expect(adapter.deleteContact("contact-id")).resolves.toBe(false);
  });
});
