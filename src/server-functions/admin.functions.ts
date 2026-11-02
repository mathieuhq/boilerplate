import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type {
  AdminAuditLogFacetsDTO,
  AdminAuditLogListDTO,
} from "@/features/admin/application/dto/admin-audit-log.dto";
import type { AdminOrganizationListDTO } from "@/features/admin/application/dto/admin-organization-list-item.dto";
import type { AdminOverviewMetricsDTO } from "@/features/admin/application/dto/admin-overview-metrics.dto";
import type { AdminRoleDTO } from "@/features/admin/application/dto/admin-role.dto";
import type {
  AdminUserListDTO,
  AdminUserListItemDTO,
} from "@/features/admin/application/dto/admin-user-list-item.dto";
import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import {
  banAdminUserSchema,
  deleteAdminRoleSchema,
  listAdminAuditLogsSchema,
  listAdminOrganizationsSchema,
  listAdminUsersSchema,
  saveAdminRoleSchema,
  setAdminUserRoleSchema,
  unbanAdminUserSchema,
} from "@/features/admin/interface/schemas/admin.schema";
import {
  accessAction,
  getRequiredActionAccess,
} from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import type { ActionResponse as ActionResponseType } from "@/shared/infrastructure/http/api-response";

type ListAdminUsersInput = z.input<typeof listAdminUsersSchema>;
type SetAdminUserRoleInput = z.infer<typeof setAdminUserRoleSchema>;
type BanAdminUserInput = z.infer<typeof banAdminUserSchema>;
type UnbanAdminUserInput = z.infer<typeof unbanAdminUserSchema>;
type ListAdminOrganizationsInput = z.input<typeof listAdminOrganizationsSchema>;
type ListAdminAuditLogsInput = z.input<typeof listAdminAuditLogsSchema>;
type SaveAdminRoleInput = z.infer<typeof saveAdminRoleSchema>;
type DeleteAdminRoleInput = z.infer<typeof deleteAdminRoleSchema>;

type AdminOverviewData = {
  stats: { date: string; count: number }[];
  metrics: AdminOverviewMetricsDTO;
};

type AdminUsersData = {
  users: AdminUserListDTO;
  roles: AdminRoleDTO[];
};

type AdminOrganizationsData = {
  organizations: AdminOrganizationListDTO;
};

type AdminAuditLogsData = {
  auditLogs: AdminAuditLogListDTO;
  facets: AdminAuditLogFacetsDTO;
};

const getAdminOverviewServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    await getRequiredActionAccess("overview", "read");

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
    await getRequiredActionAccess("users", "read");

    const adminController = container.getAdminController();
    const [users, roles] = await Promise.all([
      adminController.listUsers(data),
      adminController.listRoles(),
    ]);

    return { users, roles };
  });

const setAdminUserRoleServerFn = createServerFn({ method: "POST" })
  .validator(setAdminUserRoleSchema)
  .handler(async ({ data }) =>
    accessAction(
      "users",
      "write",
      async (actor) =>
        container.getAdminController().setUserRole({
          ...data,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        }),
      toAdminActionError,
    ),
  );

const banAdminUserServerFn = createServerFn({ method: "POST" })
  .validator(banAdminUserSchema)
  .handler(async ({ data }) =>
    accessAction(
      "users",
      "write",
      async (actor) =>
        container.getAdminController().banUser({
          ...data,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        }),
      toAdminActionError,
    ),
  );

const unbanAdminUserServerFn = createServerFn({ method: "POST" })
  .validator(unbanAdminUserSchema)
  .handler(async ({ data }) =>
    accessAction(
      "users",
      "write",
      async (actor) =>
        container.getAdminController().unbanUser({
          ...data,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        }),
      toAdminActionError,
    ),
  );

const getAdminOrganizationsServerFn = createServerFn({ method: "GET" })
  .validator(listAdminOrganizationsSchema)
  .handler(async ({ data }) => {
    await getRequiredActionAccess("organizations", "read");

    return {
      organizations: await container
        .getAdminController()
        .listOrganizations(data),
    };
  });

const getAdminAuditLogsServerFn = createServerFn({ method: "GET" })
  .validator(listAdminAuditLogsSchema)
  .handler(async ({ data }) => {
    await getRequiredActionAccess("audit-logs", "read");

    const adminController = container.getAdminController();
    const [auditLogs, facets] = await Promise.all([
      adminController.listAuditLogs(data),
      adminController.getAuditLogFacets(),
    ]);

    return { auditLogs, facets };
  });

const getAdminRolesServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    await getRequiredActionAccess("roles", "read");

    return container.getAdminController().listRoles();
  },
);

const createAdminRoleServerFn = createServerFn({ method: "POST" })
  .validator(saveAdminRoleSchema)
  .handler(async ({ data }) =>
    accessAction(
      "roles",
      "write",
      async (actor) =>
        container.getAdminController().createRole({
          ...data,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        }),
      toAdminActionError,
    ),
  );

const updateAdminRoleServerFn = createServerFn({ method: "POST" })
  .validator(saveAdminRoleSchema)
  .handler(async ({ data }) =>
    accessAction(
      "roles",
      "write",
      async (actor) =>
        container.getAdminController().updateRole({
          ...data,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        }),
      toAdminActionError,
    ),
  );

const deleteAdminRoleServerFn = createServerFn({ method: "POST" })
  .validator(deleteAdminRoleSchema)
  .handler(async ({ data }) =>
    accessAction(
      "roles",
      "write",
      async (actor) =>
        container.getAdminController().deleteRole({
          ...data,
          actorUserId: actor.user.id,
          actorAccess: actor.access,
        }),
      toAdminActionError,
    ),
  );

export async function getAdminOverviewData() {
  return getAdminOverviewServerFn() as Promise<AdminOverviewData>;
}

export async function getAdminUsersData(data: ListAdminUsersInput) {
  return getAdminUsersServerFn({ data }) as Promise<AdminUsersData>;
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
  return getAdminAuditLogsServerFn({ data }) as Promise<AdminAuditLogsData>;
}

export async function getAdminRolesData() {
  return getAdminRolesServerFn() as Promise<AdminRoleDTO[]>;
}

export async function createAdminRoleAction(data: SaveAdminRoleInput) {
  return createAdminRoleServerFn({ data }) as Promise<
    ActionResponseType<AdminRoleDTO>
  >;
}

export async function updateAdminRoleAction(data: SaveAdminRoleInput) {
  return updateAdminRoleServerFn({ data }) as Promise<
    ActionResponseType<AdminRoleDTO>
  >;
}

export async function deleteAdminRoleAction(data: DeleteAdminRoleInput) {
  return deleteAdminRoleServerFn({ data }) as Promise<
    ActionResponseType<{ key: string }>
  >;
}
