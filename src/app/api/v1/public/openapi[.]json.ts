import { createFileRoute } from "@tanstack/react-router";

import { getOpenApiDocument } from "@/shared/infrastructure/http/openapi";

export const Route = createFileRoute("/api/v1/public/openapi.json")({
  server: {
    handlers: {
      GET: () => Response.json(getOpenApiDocument()),
    },
  },
});
