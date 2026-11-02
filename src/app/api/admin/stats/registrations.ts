import { createFileRoute } from "@tanstack/react-router";

import { accessRoute } from "@/lib/zod-route";
import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

export const Route = createFileRoute("/api/admin/stats/registrations")({
  server: {
    handlers: {
      GET: accessRoute("overview", "read").handler(async () => {
        const adminController = container.getAdminController();
        const stats = await adminController.getRegistrationStats(30);

        return ApiResponse.success({ stats });
      }),
    },
  },
});
