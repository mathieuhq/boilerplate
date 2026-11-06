import { createFileRoute } from "@tanstack/react-router";

import { jobQueue } from "@/lib/queue";
import { authRoute } from "@/lib/zod-route";
import { hasAccess } from "@/shared/domain/access-control";
import { HttpError } from "@/shared/domain/errors/http.error";
import { container } from "@/shared/infrastructure/di/container";
import { createBullBoardApp } from "@/shared/infrastructure/jobs/bull-board";

const boards = new Map<boolean, ReturnType<typeof createBullBoardApp>>();

function getBoard(readOnlyMode: boolean) {
  if (!jobQueue) throw HttpError.notFound("Redis is not configured");

  let board = boards.get(readOnlyMode);

  if (!board) {
    board = createBullBoardApp(jobQueue, readOnlyMode);
    boards.set(readOnlyMode, board);
  }

  return board;
}

const handler = authRoute.handler(async ({ request, ctx }) => {
  const access = await container
    .getAdminController()
    .resolveAccess(ctx.user.role);

  if (!hasAccess(access, "jobs", "read"))
    throw HttpError.forbidden("Missing access to this feature");

  const canWrite = hasAccess(access, "jobs", "write");

  if (request.method !== "GET" && !canWrite)
    throw HttpError.forbidden("Missing access to this feature");

  return getBoard(!canWrite).fetch(request);
});

export const Route = createFileRoute("/api/v1/private/admin/jobs/$")({
  server: {
    handlers: { GET: handler, POST: handler, PUT: handler, PATCH: handler },
  },
});
