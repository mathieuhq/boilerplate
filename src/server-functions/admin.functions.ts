import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { AdminAuditLogListDTO } from "@/features/admin/application/dto/admin-audit-log.dto";
import type {
  AdminOrganizationDetailsDTO,
  AdminOrganizationListDTO,
} from "@/features/admin/application/dto/admin-organization-list-item.dto";
import type { AdminOverviewMetricsDTO } from "@/features/admin/application/dto/admin-overview-metrics.dto";
import type {
  AdminUserListDTO,
  AdminUserListItemDTO,
} from "@/features/admin/application/dto/admin-user-list-item.dto";
import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import {
  banAdminUserSchema,
  listAdminAuditLogsSchema,
  listAdminOrganizationsSchema,
  listAdminUsersSchema,
  setAdminUserRoleSchema,
  unbanAdminUserSchema,
} from "@/features/admin/interface/schemas/admin.schema";
import { getRequiredActionAdmin } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

type ListAdminUsersInput = z.infer<typeof listAdminUsersSchema>;
type SetAdminUserRoleInput = z.infer<typeof setAdminUserRoleSchema>;
type BanAdminUserInput = z.infer<typeof banAdminUserSchema>;
type UnbanAdminUserInput = z.infer<typeof unbanAdminUserSchema>;
type ListAdminOrganizationsInput = z.infer<typeof listAdminOrganizationsSchema>;
type ListAdminAuditLogsInput = z.infer<typeof listAdminAuditLogsSchema>;

type AdminOverviewData = {
  stats: { date: string; count: number }[];
  metrics: AdminOverviewMetricsDTO;
};

type AdminOrganizationsData = {
  organizations: AdminOrganizationListDTO;
  organization: AdminOrganizationDetailsDTO | null;
};

function adminActionErrorResponse(error: unknown) {
  return actionErrorResponse(toAdminActionError(error));
}

const getAdminOverviewServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    await getRequiredActionAdmin();

    const adminController = container.getAdminController();
    const [stats, metrics] = await Promise.all([
      adminController.getRegistrationStats(30),
      adminController.getOverviewMetrics(),
    ]);

    return { stats, metrics };
  },
);

const getAdminUsersServerFn = createServerFn({ method: "GET" })
  .validator(listAdminUsersSchema)
  .handler(async ({ data }) => {
    await getRequiredActionAdmin();

    const adminController = container.getAdminController();
    const users = await adminController.listUsers(data);

    return users;
  });

const setAdminUserRoleServerFn = createServerFn({ method: "POST" })
  .validator(setAdminUserRoleSchema)
  .handler(async ({ data }) => {
    try {
      const actor = await getRequiredActionAdmin();
      const adminController = container.getAdminController();
      const user = await adminController.setUserRole({
        ...data,
        actorUserId: actor.id,
      });

      return ActionResponse.success(user);
    } catch (error) {
      return adminActionErrorResponse(error);
    }
  });

const banAdminUserServerFn = createServerFn({ method: "POST" })
  .validator(banAdminUserSchema)
  .handler(async ({ data }) => {
    try {
      const actor = await getRequiredActionAdmin();
      const adminController = container.getAdminController();
      const user = await adminController.banUser({
        ...data,
        actorUserId: actor.id,
      });

      return ActionResponse.success(user);
    } catch (error) {
      return adminActionErrorResponse(error);
    }
  });

const unbanAdminUserServerFn = createServerFn({ method: "POST" })
  .validator(unbanAdminUserSchema)
  .handler(async ({ data }) => {
    try {
      const actor = await getRequiredActionAdmin();
      const adminController = container.getAdminController();
      const user = await adminController.unbanUser({
        ...data,
        actorUserId: actor.id,
      });

      return ActionResponse.success(user);
    } catch (error) {
      return adminActionErrorResponse(error);
    }
  });

const getAdminOrganizationsServerFn = createServerFn({ method: "GET" })
  .validator(listAdminOrganizationsSchema)
  .handler(async ({ data }) => {
    await getRequiredActionAdmin();

    const adminController = container.getAdminController();
    const [organizations, organization] = await Promise.all([
      adminController.listOrganizations(data),
      data.organizationId
        ? adminController.getOrganizationDetails(data.organizationId)
        : Promise.resolve(null),
    ]);

    return { organizations, organization };
  });

const getAdminAuditLogsServerFn = createServerFn({ method: "GET" })
  .validator(listAdminAuditLogsSchema)
  .handler(async ({ data }) => {
    await getRequiredActionAdmin();

    const adminController = container.getAdminController();
    const auditLogs = await adminController.listAuditLogs({
      ...data,
      from: toDate(data.from),
      to: toDate(data.to),
    });

    return auditLogs;
  });

export async function getAdminOverviewData() {
  return getAdminOverviewServerFn() as Promise<AdminOverviewData>;
}

export async function getAdminUsersData(data: ListAdminUsersInput) {
  return getAdminUsersServerFn({ data }) as Promise<AdminUserListDTO>;
}

export async function setAdminUserRoleAction(data: SetAdminUserRoleInput) {
  return setAdminUserRoleServerFn({ data }) as Promise<
    ActionResponseType<AdminUserListItemDTO>
  >;
}

export async function banAdminUserAction(data: BanAdminUserInput) {
  return banAdminUserServerFn({ data }) as Promise<
    ActionResponseType<AdminUserListItemDTO>
  >;
}

export async function unbanAdminUserAction(data: UnbanAdminUserInput) {
  return unbanAdminUserServerFn({ data }) as Promise<
    ActionResponseType<AdminUserListItemDTO>
  >;
}

export async function getAdminOrganizationsData(
  data: ListAdminOrganizationsInput,
) {
  return getAdminOrganizationsServerFn({
    data,
  }) as Promise<AdminOrganizationsData>;
}

export async function getAdminAuditLogsData(data: ListAdminAuditLogsInput) {
  return getAdminAuditLogsServerFn({ data }) as Promise<AdminAuditLogListDTO>;
}

function toDate(value?: string) {
  if (!value) return undefined;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}
