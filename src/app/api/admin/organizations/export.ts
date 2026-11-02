import { createFileRoute } from "@tanstack/react-router";

import { getAdminOrganizationCsvColumns } from "@/features/admin/interface/csv/admin-csv-columns";
import { listAdminOrganizationsSchema } from "@/features/admin/interface/schemas/admin.schema";
import { getTranslations } from "@/i18n/server";
import { accessRoute } from "@/lib/zod-route";
import { createCsvStream, csvResponse } from "@/shared/infrastructure/csv/csv";
import { container } from "@/shared/infrastructure/di/container";
import { parseListQueryRequest } from "@/shared/infrastructure/http/list-query-request";

export const Route = createFileRoute("/api/admin/organizations/export")({
  server: {
    handlers: {
      GET: accessRoute("organizations", "read").handler(
        async ({ request, ctx }) => {
          const query = parseListQueryRequest(
            request,
            listAdminOrganizationsSchema,
          );
          const [batches, t] = await Promise.all([
            container
              .getAdminController()
              .exportOrganizations({ actorUserId: ctx.user.id, query }),
            getTranslations("admin.export.organizations"),
          ]);

          return csvResponse(
            createCsvStream(getAdminOrganizationCsvColumns(t), batches),
            "organizations",
          );
        },
      ),
    },
  },
});
