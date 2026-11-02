import { describe, expect, it, vi } from "vitest";

import { Result } from "@/shared/application/result";

import { EmailDeliveryError } from "../../application/errors/email-delivery.error";
import type { QueueEmailUseCase } from "../../application/use-cases/queue-email.use-case";
import type { SendEmailUseCase } from "../../application/use-cases/send-email.use-case";
import type { SubscribeContactUseCase } from "../../application/use-cases/subscribe-contact.use-case";
import type { UnsubscribeContactUseCase } from "../../application/use-cases/unsubscribe-contact.use-case";
import { EmailController } from "../controllers/email.controller";

const payload = { to: "user@example.com", subject: "Hi", html: "<p>Hi</p>" };

const createController = (
  sendResult: Awaited<ReturnType<SendEmailUseCase["execute"]>>,
) => {
  const sendEmailUseCase = {
    execute: vi.fn().mockResolvedValue(sendResult),
  } as unknown as SendEmailUseCase;

  return new EmailController(
    sendEmailUseCase,
    {} as QueueEmailUseCase,
    {} as SubscribeContactUseCase,
    {} as UnsubscribeContactUseCase,
  );
};

describe("EmailController.deliverQueuedEmail", () => {
  it("returns the delivery result when the provider accepts the email", async () => {
    const controller = createController(
      Result.ok({ success: true, emailId: "email-1" }),
    );

    await expect(controller.deliverQueuedEmail(payload)).resolves.toEqual({
      success: true,
      emailId: "email-1",
    });
  });

  it("throws so the job is retried when the provider rejects the email", async () => {
    const controller = createController(
      Result.ok({ success: false, error: "Provider down" }),
    );

    await expect(controller.deliverQueuedEmail(payload)).rejects.toThrow(
      new EmailDeliveryError("Provider down"),
    );
  });
});
