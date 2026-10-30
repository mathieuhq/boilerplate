import { describe, expect, it, vi } from "vitest";

import { ConsoleEmailAdapter } from "../console-email.adapter";

describe("ConsoleEmailAdapter", () => {
  it("logs the email with its decoded links instead of sending it", async () => {
    const log = vi.fn();
    const adapter = new ConsoleEmailAdapter(log);

    const result = await adapter.send({
      subject: "Verify your email address",
      html: '<a href="http://localhost:3000/api/auth/verify-email?token=abc&amp;callbackURL=%2F">Verify</a>',
      to: "user@example.com",
    });

    expect(result).toEqual({
      error: null,
      data: expect.stringMatching(/^console-/),
    });
    expect(log).toHaveBeenCalledWith(expect.any(String), {
      to: ["user@example.com"],
      subject: "Verify your email address",
      links: [
        "http://localhost:3000/api/auth/verify-email?token=abc&callbackURL=%2F",
      ],
    });
  });
});
