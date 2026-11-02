import { createFileRoute } from "@tanstack/react-router";

import { toDataExportHttpError } from "@/features/user/interface/errors/data-export-error.mapper";
import { authRoute } from "@/lib/zod-route";
import { container } from "@/shared/infrastructure/di/container";

export const Route = createFileRoute("/api/user/data-exports/$exportId")({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        authRoute.handler(async ({ ctx }) => {
          try {
            const { downloadUrl } = await container
              .getDataExportController()
              .getDownloadUrl(ctx.user.id, params.exportId);

            return new Response(null, {
              status: 302,
              headers: {
                Location: downloadUrl,
                "Cache-Control": "no-store",
                "Referrer-Policy": "no-referrer",
              },
            });
          } catch (error) {
            throw toDataExportHttpError(error);
          }
        })({ request }),
    },
  },
});
