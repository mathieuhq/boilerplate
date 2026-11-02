import { createFileRoute } from "@tanstack/react-router";

import { getAdminAuditLogCsvColumns } from "@/features/admin/interface/csv/admin-csv-columns";
import { listAdminAuditLogsSchema } from "@/features/admin/interface/schemas/admin.schema";
import { getTranslations } from "@/i18n/server";
import { accessRoute } from "@/lib/zod-route";
import { createCsvStream, csvResponse } from "@/shared/infrastructure/csv/csv";
import { container } from "@/shared/infrastructure/di/container";
import { parseListQueryRequest } from "@/shared/infrastructure/http/list-query-request";

export const Route = createFileRoute("/api/admin/audit-logs/export")({
  server: {
    handlers: {
      GET: accessRoute("audit-logs", "read").handler(
        async ({ request, ctx }) => {
          const query = parseListQueryRequest(
            request,
            listAdminAuditLogsSchema,
          );
          const [batches, t] = await Promise.all([
            container
              .getAdminController()
              .exportAuditLogs({ actorUserId: ctx.user.id, query }),
            getTranslations("admin.export.auditLogs"),
          ]);

          return csvResponse(
            createCsvStream(getAdminAuditLogCsvColumns(t), batches),
            "audit-logs",
          );
        },
      ),
    },
  },
});
