import { createFileRoute } from "@tanstack/react-router";

import { ApiResponse } from "@/shared/infrastructure/http/api-response";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const response = ApiResponse.success({
          status: "ok",
          timestamp: new Date().toISOString(),
        });

        response.headers.set("Cache-Control", "no-store");

        return response;
      },
    },
  },
});
