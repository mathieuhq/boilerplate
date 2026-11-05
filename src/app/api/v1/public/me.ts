import { createFileRoute } from "@tanstack/react-router";

import { publicRoute } from "@/lib/zod-route";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

export const Route = createFileRoute("/api/v1/public/me")({
  server: {
    handlers: {
      GET: publicRoute.handler(({ ctx }) => ApiResponse.success(ctx)),
    },
  },
});
