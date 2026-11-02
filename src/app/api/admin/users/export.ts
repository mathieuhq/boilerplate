import { createFileRoute } from "@tanstack/react-router";

import { getAdminUserCsvColumns } from "@/features/admin/interface/csv/admin-csv-columns";
import { listAdminUsersSchema } from "@/features/admin/interface/schemas/admin.schema";
import { getTranslations } from "@/i18n/server";
import { accessRoute } from "@/lib/zod-route";
import { createCsvStream, csvResponse } from "@/shared/infrastructure/csv/csv";
import { container } from "@/shared/infrastructure/di/container";
import { parseListQueryRequest } from "@/shared/infrastructure/http/list-query-request";

export const Route = createFileRoute("/api/admin/users/export")({
  server: {
    handlers: {
      GET: accessRoute("users", "read").handler(async ({ request, ctx }) => {
        const query = parseListQueryRequest(request, listAdminUsersSchema);
        const [batches, t] = await Promise.all([
          container
            .getAdminController()
            .exportUsers({ actorUserId: ctx.user.id, query }),
          getTranslations("admin.export.users"),
        ]);

        return csvResponse(
          createCsvStream(getAdminUserCsvColumns(t), batches),
          "users",
        );
      }),
    },
  },
});
