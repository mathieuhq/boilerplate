import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IEmailProviderPort } from "@/features/email/application/ports/email-provider.port";
import { createMockEmailProvider } from "@/test/utils/mock-factories";
import { pretty, render } from "@react-email/render";

import { SendEmailUseCase } from "../use-cases/send-email.use-case";

const mockEnv = vi.hoisted(() => ({
  NODE_ENV: "test" as string,
  EMAIL_FROM: "test@example.com",
}));

vi.mock("@/lib/env", () => ({
  env: mockEnv,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@react-email/render", () => ({
  render: vi.fn(),
  pretty: vi.fn(),
}));

describe("SendEmailUseCase", () => {
  let useCase: SendEmailUseCase;
  let mockEmailProvider: IEmailProviderPort;

  beforeEach(() => {
    mockEmailProvider = createMockEmailProvider();
    useCase = new SendEmailUseCase(mockEmailProvider);
  });

  it("should send email successfully with string html", async () => {
    vi.mocked(mockEmailProvider.send).mockResolvedValue({
      error: null,
      data: "email-123",
    });

    const result = await useCase.execute({
      html: "<p>Hello</p>",
      subject: "Test Email",
      to: "recipient@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
    expect(result.value.emailId).toBe("email-123");
  });

  it("should call provider with correct params", async () => {
    vi.mocked(mockEmailProvider.send).mockResolvedValue({
      error: null,
      data: "email-123",
    });

    await useCase.execute({
      html: "<p>Hello</p>",
      subject: "Test Email",
      to: "recipient@example.com",
      replyTo: "reply@example.com",
    });

    expect(mockEmailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: "<p>Hello</p>",
        to: "recipient@example.com",
        replyTo: "reply@example.com",
        subject: expect.stringContaining("Test Email"),
      }),
    );
  });

  it("should return error result when provider fails", async () => {
    vi.mocked(mockEmailProvider.send).mockResolvedValue({
      error: new Error("Provider error"),
      data: null,
    });

    const result = await useCase.execute({
      html: "<p>Hello</p>",
      subject: "Test Email",
      to: "recipient@example.com",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(false);
    expect(result.value.error).toBe("Provider error");
  });

  it("should handle multiple recipients", async () => {
    vi.mocked(mockEmailProvider.send).mockResolvedValue({
      error: null,
      data: "email-123",
    });

    await useCase.execute({
      html: "<p>Hello</p>",
      subject: "Test Email",
      to: ["user1@example.com", "user2@example.com"],
    });

    expect(mockEmailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["user1@example.com", "user2@example.com"],
      }),
    );
  });

  it("should handle cc and bcc", async () => {
    vi.mocked(mockEmailProvider.send).mockResolvedValue({
      error: null,
      data: "email-123",
    });

    await useCase.execute({
      html: "<p>Hello</p>",
      cc: "cc@example.com",
      subject: "Test Email",
      bcc: "bcc@example.com",
      to: "recipient@example.com",
    });

    expect(mockEmailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        cc: "cc@example.com",
        bcc: "bcc@example.com",
      }),
    );
  });

  it("should render React component to HTML when html is not a string", async () => {
    vi.mocked(render).mockResolvedValue("<html>rendered</html>");
    vi.mocked(pretty).mockResolvedValue("<html>pretty</html>");
    vi.mocked(mockEmailProvider.send).mockResolvedValue({
      error: null,
      data: "email-123",
    });

    const reactElement = { type: "div", props: { children: "Hello" } };

    const result = await useCase.execute({
      subject: "Test Email",
      to: "recipient@example.com",
      html: reactElement as React.ReactElement,
    });

    expect(vi.mocked(render)).toHaveBeenCalledWith(reactElement);
    expect(vi.mocked(pretty)).toHaveBeenCalledWith("<html>rendered</html>");
    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);
    expect(mockEmailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: "<html>pretty</html>",
      }),
    );
  });

  it("should prefix subject with [DEV] in development environment", async () => {
    mockEnv.NODE_ENV = "development";

    vi.mocked(mockEmailProvider.send).mockResolvedValue({
      error: null,
      data: "email-123",
    });

    await useCase.execute({
      html: "<p>Hello</p>",
      subject: "Test Email",
      to: "recipient@example.com",
    });

    expect(mockEmailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "[DEV] Test Email",
      }),
    );

    mockEnv.NODE_ENV = "test";
  });
});
