import type { Queue } from "bullmq";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BULL_BOARD_CONTENT_SECURITY_POLICY,
  BULL_BOARD_PATH,
  createBullBoardHandler,
  REDACTED_JOB_VALUE,
} from "../bull-board";

const ORIGIN = "https://app.example.com";

function createJob(state: string) {
  return {
    toJSON: () => ({
      id: "1",
      name: "email.send",
      progress: 0,
      attemptsMade: 1,
      timestamp: 1,
      opts: {},
      data: { html: '<a href="https://app/reset?token=secret">Reset</a>' },
      returnvalue: "resend-id",
      failedReason: "Resend rejected secret@example.com",
      stacktrace: ["Error: at secret"],
    }),
    getState: vi.fn().mockResolvedValue(state),
    retry: vi.fn().mockResolvedValue(undefined),
    updateData: vi.fn().mockResolvedValue(undefined),
  };
}

function setup(state = "failed") {
  const job = createJob(state);
  const queue = {
    name: "jobs",
    metaValues: { version: "bullmq:6.7.0" },
    getJob: vi.fn().mockResolvedValue(job),
    getJobLogs: vi.fn().mockResolvedValue({ logs: ["sent to secret"] }),
  };
  const handle = createBullBoardHandler(queue as unknown as Queue, [ORIGIN]);

  return { job, queue, handle };
}

function request(
  path: string,
  method = "GET",
  origin?: string,
  body: unknown = { jobData: {} },
) {
  return new Request(`${ORIGIN}${BULL_BOARD_PATH}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
}

describe("createBullBoardHandler", () => {
  let context: ReturnType<typeof setup>;

  beforeEach(() => {
    context = setup();
  });

  it("redacts job data, results and errors for read-only viewers", async () => {
    const response = await context.handle(request("/api/queues/jobs/1"), false);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).not.toContain("secret");
    expect(JSON.parse(text).job).toMatchObject({
      data: REDACTED_JOB_VALUE,
      returnValue: REDACTED_JOB_VALUE,
      failedReason: REDACTED_JOB_VALUE,
      stacktrace: [],
      isFailed: true,
    });
  });

  it("hides job logs from read-only viewers", async () => {
    const response = await context.handle(
      request("/api/queues/jobs/1/logs"),
      false,
    );

    expect(await response.json()).toEqual([]);
    expect(context.queue.getJobLogs).not.toHaveBeenCalled();
  });

  it("shows job data and logs to viewers with write access", async () => {
    const job = await context.handle(request("/api/queues/jobs/1"), true);
    const logs = await context.handle(request("/api/queues/jobs/1/logs"), true);

    expect((await job.json()).job.data).toEqual(context.job.toJSON().data);
    expect(await logs.json()).toEqual(["sent to secret"]);
  });

  it("refuses mutations from read-only viewers", async () => {
    await expect(
      context.handle(request("/api/queues/jobs/1/retry", "PUT", ORIGIN), false),
    ).rejects.toMatchObject({ status: 403 });
    expect(context.job.retry).not.toHaveBeenCalled();
  });

  it.each([undefined, "https://evil.example.com"])(
    "refuses mutations from origin %s",
    async (origin) => {
      await expect(
        context.handle(
          request("/api/queues/jobs/1/retry", "PUT", origin),
          true,
        ),
      ).rejects.toMatchObject({ status: 403 });
      expect(context.job.retry).not.toHaveBeenCalled();
    },
  );

  it("retries failed jobs from a trusted origin", async () => {
    const response = await context.handle(
      request("/api/queues/jobs/1/retry", "PUT", ORIGIN),
      true,
    );

    expect(response.status).toBe(204);
    expect(context.job.retry).toHaveBeenCalledWith("failed", undefined);
  });

  it("refuses to retry completed jobs", async () => {
    context = setup("completed");

    const response = await context.handle(
      request("/api/queues/jobs/1/retry", "PUT", ORIGIN),
      true,
    );

    expect(response.status).toBe(403);
    expect(context.job.retry).not.toHaveBeenCalled();
  });

  it("refuses to edit job data", async () => {
    const response = await context.handle(
      request("/api/queues/jobs/1/update-data", "PATCH", ORIGIN),
      true,
    );

    expect(response.status).toBe(403);
    expect(context.job.updateData).not.toHaveBeenCalled();
  });

  it.each([
    {
      path: "/api/queues/jobs/add",
      body: { name: "email.send", data: { html: "<p>" }, options: {} },
    },
    {
      path: "/api/queues/jobs/job-schedulers",
      body: {
        id: "spam",
        name: "email.send",
        data: { html: "<p>" },
        repeat: { pattern: "* * * * *" },
      },
    },
  ])("refuses to add jobs through $path", async ({ path, body }) => {
    const response = await context.handle(
      request(path, "POST", ORIGIN, body),
      true,
    );

    expect(response.status).toBe(403);
  });

  it("serves the board page with a strict content security policy", async () => {
    const response = await context.handle(request("/"), false);
    const html = await response.text();

    expect(response.headers.get("content-type")).toContain("text/html");
    expect(html).toContain(
      `<meta http-equiv="Content-Security-Policy" content="${BULL_BOARD_CONTENT_SECURITY_POLICY}" />`,
    );
    expect(BULL_BOARD_CONTENT_SECURITY_POLICY).toContain("script-src 'self';");
  });
});
