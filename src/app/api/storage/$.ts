import { createFileRoute } from "@tanstack/react-router";

import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

const storagePrefix = "/api/storage/";

export const Route = createFileRoute("/api/storage/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = decodeURIComponent(
          url.pathname.slice(storagePrefix.length),
        );

        if (!key)
          return ApiResponse.badRequest("MISSING_PATH", "Missing file path");

        try {
          const storageController = container.getStorageController();
          const result = await storageController.generateDownloadUrl(key);

          return Response.redirect(result.downloadUrl, 302);
        } catch {
          return ApiResponse.notFound("File");
        }
      },
    },
  },
});
