import { describe, expect, it, vi } from "vitest";

import { BullMqJobQueueAdapter } from "../bullmq-job-queue.adapter";
import { InlineJobQueueAdapter } from "../inline-job-queue.adapter";

type TestJobs = {
  "report.build": { reportId: string };
};

describe("BullMqJobQueueAdapter", () => {
  it("adds the job with its payload, id and delay", async () => {
    const store = { add: vi.fn().mockResolvedValue({}) };
    const queue = new BullMqJobQueueAdapter<TestJobs>(store);

    await queue.enqueue(
      { name: "report.build", payload: { reportId: "r1" } },
      { jobId: "report:r1", delayMs: 5_000 },
    );

    expect(store.add).toHaveBeenCalledWith(
      "report.build",
      { reportId: "r1" },
      { jobId: "report:r1", delay: 5_000 },
    );
  });

  it("propagates store failures", async () => {
    const store = { add: vi.fn().mockRejectedValue(new Error("offline")) };
    const queue = new BullMqJobQueueAdapter<TestJobs>(store);

    await expect(
      queue.enqueue({ name: "report.build", payload: { reportId: "r1" } }),
    ).rejects.toThrow("offline");
  });
});

describe("InlineJobQueueAdapter", () => {
  it("processes the job immediately", async () => {
    const process = vi.fn().mockResolvedValue(undefined);
    const queue = new InlineJobQueueAdapter<TestJobs>(process);

    await queue.enqueue({ name: "report.build", payload: { reportId: "r1" } });

    expect(process).toHaveBeenCalledWith({
      name: "report.build",
      data: { reportId: "r1" },
    });
  });

  it("propagates processing failures", async () => {
    const queue = new InlineJobQueueAdapter<TestJobs>(
      vi.fn().mockRejectedValue(new Error("boom")),
    );

    await expect(
      queue.enqueue({ name: "report.build", payload: { reportId: "r1" } }),
    ).rejects.toThrow("boom");
  });
});
