import { createFileRoute } from "@tanstack/react-router";

import { getTrustedOrigins } from "@/lib/env";
import { jobQueue } from "@/lib/queue";
import { getServerUrl } from "@/lib/server-url";
import { authRoute } from "@/lib/zod-route";
import { hasAccess } from "@/shared/domain/access-control";
import { HttpError } from "@/shared/domain/errors/http.error";
import { container } from "@/shared/infrastructure/di/container";
import { createBullBoardHandler } from "@/shared/infrastructure/jobs/bull-board";

let bullBoard: ReturnType<typeof createBullBoardHandler> | undefined;

function getBullBoard() {
  if (!jobQueue) throw HttpError.notFound("Redis is not configured");

  bullBoard ??= createBullBoardHandler(
    jobQueue,
    [getServerUrl(), ...getTrustedOrigins()].map((url) => new URL(url).origin),
  );

  return bullBoard;
}

const handler = authRoute.handler(async ({ request, ctx }) => {
  const access = await container
    .getAdminController()
    .resolveAccess(ctx.user.role);

  if (!hasAccess(access, "jobs", "read"))
    throw HttpError.forbidden("Missing access to this feature");

  return getBullBoard()(request, hasAccess(access, "jobs", "write"));
});

export const Route = createFileRoute("/api/v1/private/admin/jobs/$")({
  server: {
    handlers: { GET: handler, POST: handler, PUT: handler, PATCH: handler },
  },
});
