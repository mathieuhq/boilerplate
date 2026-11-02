import { createServerFn } from "@tanstack/react-start";

import type { OrganizationAuditLogListDTO } from "@/features/organization/application/dto/organization-audit-log.dto";
import { listOrganizationAuditLogsSchema } from "@/features/organization/interface/schemas/organization.schema";
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";

export const getOrganizationActivityData = createServerFn({ method: "GET" })
  .validator(listOrganizationAuditLogsSchema)
  .handler(async ({ data }): Promise<OrganizationAuditLogListDTO> => {
    await getRequiredActionUser();

    return container.getOrganizationActivityController().listAuditLogs(data);
  });
