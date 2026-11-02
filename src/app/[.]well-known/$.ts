import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/lib/auth";

export const Route = createFileRoute("/.well-known/$")({
  server: {
    handlers: {
      GET: async ({ request }) => auth.handler(request),
    },
  },
});
