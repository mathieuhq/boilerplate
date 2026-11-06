import type { Job, Queue } from "bullmq";

import { SITE_CONFIG } from "@/lib/site-config";
import { HttpError } from "@/shared/domain/errors/http.error";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { H3Adapter } from "@bull-board/h3";

import { BULL_BOARD_PATH } from "./bull-board-path";

export const REDACTED_JOB_VALUE = "[redacted]";

export const BULL_BOARD_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SAFE_METHODS = new Set(["GET", "HEAD"]);

function disabledActionError(action: string) {
  return Object.assign(new Error(`${action} is disabled`), {
    statusCode: 403,
  });
}

function redactJobJson(json: ReturnType<Job["toJSON"]>) {
  return {
    ...json,
    data: REDACTED_JOB_VALUE,
    returnvalue: REDACTED_JOB_VALUE,
    failedReason: json.failedReason && REDACTED_JOB_VALUE,
    stacktrace: [],
  };
}

class GuardedBullMQAdapter extends BullMQAdapter {
  override readonly allowCompletedRetries = false;

  constructor(
    queue: Queue,
    private readonly redact: boolean,
  ) {
    super(queue, { readOnlyMode: redact });
  }

  override async getJob(id: string) {
    const job = await super.getJob(id);

    return job && this.guard(job);
  }

  override async getJobs(...args: Parameters<BullMQAdapter["getJobs"]>) {
    const jobs = await super.getJobs(...args);

    return jobs.map((job) => this.guard(job));
  }

  override async getJobLogs(id: string) {
    return this.redact ? [] : super.getJobLogs(id);
  }

  override async addJob(): Promise<never> {
    throw disabledActionError("Adding jobs");
  }

  override async createJobScheduler(): Promise<never> {
    throw disabledActionError("Creating job schedulers");
  }

  private guard(job: Job): Job {
    const guarded: Job = Object.create(job);

    guarded.updateData = async () => {
      throw disabledActionError("Editing job data");
    };

    guarded.retry = async (state, opts) => {
      if (state === "completed")
        throw disabledActionError("Retrying completed jobs");

      return job.retry(state, opts);
    };

    if (this.redact) guarded.toJSON = () => redactJobJson(job.toJSON());

    return guarded;
  }
}

function createBullBoardApp(queue: Queue, readOnlyMode: boolean) {
  const serverAdapter = new H3Adapter().setBasePath(BULL_BOARD_PATH);

  createBullBoard({
    queues: [new GuardedBullMQAdapter(queue, readOnlyMode)],
    serverAdapter,
    options: { uiConfig: { boardTitle: SITE_CONFIG.TITLE } },
  });

  return serverAdapter.registerHandlers();
}

async function withContentSecurityPolicy(response: Response) {
  if (!response.headers.get("content-type")?.startsWith("text/html"))
    return response;

  const html = await response.text();
  const headers = new Headers(response.headers);

  headers.delete("content-length");

  return new Response(
    html.replace(
      "<head>",
      `<head><meta http-equiv="Content-Security-Policy" content="${BULL_BOARD_CONTENT_SECURITY_POLICY}" />`,
    ),
    { status: response.status, headers },
  );
}

export function createBullBoardHandler(
  queue: Queue,
  trustedOrigins: readonly string[],
) {
  const readBoard = createBullBoardApp(queue, true);
  const writeBoard = createBullBoardApp(queue, false);

  return async (request: Request, canWrite: boolean) => {
    if (!SAFE_METHODS.has(request.method)) {
      if (!canWrite)
        throw HttpError.forbidden("Missing access to this feature");

      if (!trustedOrigins.includes(request.headers.get("origin") ?? ""))
        throw HttpError.forbidden("Untrusted request origin");
    }

    const board = canWrite ? writeBoard : readBoard;

    return withContentSecurityPolicy(await board.fetch(request));
  };
}
