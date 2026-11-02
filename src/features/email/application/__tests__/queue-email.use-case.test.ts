import { render } from "react-email";
import { describe, expect, it, vi } from "vitest";

import type { IJobQueuePort } from "@/shared/application/ports/job-queue.port";

import type { EmailJobs } from "../jobs/email.jobs";
import { QueueEmailUseCase } from "../use-cases/queue-email.use-case";

vi.mock("react-email", () => ({
  render: vi.fn(),
  pretty: vi.fn(async (html: string) => html),
}));

const createQueue = (): IJobQueuePort<EmailJobs> => ({
  enqueue: vi.fn().mockResolvedValue(undefined),
});

describe("QueueEmailUseCase", () => {
  it("enqueues the email with string html", async () => {
    const queue = createQueue();
    const useCase = new QueueEmailUseCase(queue);

    const result = await useCase.execute({
      to: "user@example.com",
      subject: "Welcome",
      html: "<p>Hi</p>",
    });

    expect(result.value).toEqual({ queued: true });
    expect(queue.enqueue).toHaveBeenCalledWith({
      name: "email.send",
      payload: expect.objectContaining({
        to: "user@example.com",
        subject: "Welcome",
        html: "<p>Hi</p>",
      }),
    });
  });

  it("renders React emails before enqueueing them", async () => {
    vi.mocked(render).mockResolvedValue("<p>Rendered</p>");
    const queue = createQueue();
    const useCase = new QueueEmailUseCase(queue);

    await useCase.execute({
      to: "user@example.com",
      subject: "Welcome",
      html: { type: "div", props: {}, key: null } as React.ReactElement,
    });

    expect(queue.enqueue).toHaveBeenCalledWith({
      name: "email.send",
      payload: expect.objectContaining({ html: "<p>Rendered</p>" }),
    });
  });

  it("encodes buffer attachments as base64 so they survive serialization", async () => {
    const queue = createQueue();
    const useCase = new QueueEmailUseCase(queue);

    await useCase.execute({
      to: "user@example.com",
      subject: "Invoice",
      html: "<p>Invoice</p>",
      attachments: [
        { filename: "a.txt", content: Buffer.from("hello") },
        { filename: "b.txt", content: "d29ybGQ=" },
      ],
    });

    expect(queue.enqueue).toHaveBeenCalledWith({
      name: "email.send",
      payload: expect.objectContaining({
        attachments: [
          { filename: "a.txt", content: "aGVsbG8=" },
          { filename: "b.txt", content: "d29ybGQ=" },
        ],
      }),
    });
  });

  it("propagates queue failures", async () => {
    const queue = createQueue();
    vi.mocked(queue.enqueue).mockRejectedValue(new Error("offline"));
    const useCase = new QueueEmailUseCase(queue);

    await expect(
      useCase.execute({ to: "a@b.co", subject: "Hi", html: "<p>Hi</p>" }),
    ).rejects.toThrow("offline");
  });
});
