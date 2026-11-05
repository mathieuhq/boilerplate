import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/lib/auth";
import { withResolvedClientIp } from "@/lib/ip";

export const Route = createFileRoute("/api/v1/private/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => auth.handler(withResolvedClientIp(request)),
      POST: async ({ request }) => auth.handler(withResolvedClientIp(request)),
    },
  },
});
