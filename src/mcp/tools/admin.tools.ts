import { z } from "zod";

import {
  ADMIN_AUDIT_LOG_SORT_FIELDS,
  ADMIN_ORGANIZATION_SORT_FIELDS,
  ADMIN_USER_SORT_FIELDS,
} from "@/features/admin/domain/admin-list";
import { ROLE_KEY_PATTERN } from "@/features/admin/domain/roles";
import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import {
  ACCESS_FEATURE_KEYS,
  ACCESS_FEATURES,
  ACCESS_LEVELS,
} from "@/shared/domain/access-control";
import {
  DATE_RANGE_SEPARATOR,
  MAX_PAGE_SIZE,
  SORT_DIRECTIONS,
} from "@/shared/domain/list-query";
import { container } from "@/shared/infrastructure/di/container";

import { defineMcpTool, type McpUser } from "../tool";

function listInputSchema<const TSortField extends string>(
  sortFields: readonly [TSortField, ...TSortField[]],
) {
  return z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).default(20),
    sort: z
      .templateLiteral([z.enum(sortFields), ".", z.enum(SORT_DIRECTIONS)])
      .optional()
      .describe(
        `Sort as field.direction, for example ${sortFields[0]}.asc. Fields: ${sortFields.join(", ")}`,
      ),
    search: z.string().min(1).optional(),
  });
}

const dateRangeInputSchema = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?\.\.(\d{4}-\d{2}-\d{2})?$/)
  .describe(
    `Inclusive UTC day range as YYYY-MM-DD${DATE_RANGE_SEPARATOR}YYYY-MM-DD, either side may be empty`,
  );

const userIdInputSchema = z.object({
  userId: z.string().min(1),
});

const dateTimeString = z.iso
  .datetime({ offset: true })
  .describe("ISO 8601 date-time");

const roleKeyInputSchema = z
  .string()
  .regex(ROLE_KEY_PATTERN)
  .describe("Role key: admin, user or a custom role key");

const saveRoleInputSchema = z.object({
  key: roleKeyInputSchema,
  name: z.string().min(2).max(64),
  description: z.string().max(280).optional(),
  access: z
    .partialRecord(z.enum(ACCESS_FEATURE_KEYS), z.enum(ACCESS_LEVELS))
    .describe(
      `Access level per feature, write includes read. Features and their levels: ${ACCESS_FEATURE_KEYS.map((feature) => `${feature} (${ACCESS_FEATURES[feature].levels.join(", ")})`).join(", ")}`,
    ),
});

const mapError = toAdminActionError;

function toActor(user: McpUser) {
  return { actorUserId: user.id, actorAccess: user.access };
}

function toOptionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export const adminTools = [
  defineMcpTool({
    name: "admin_get_overview",
    title: "Get admin overview",
    description:
      "Returns platform metrics and daily registrations for the last 30 days.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
    access: { feature: "overview", level: "read" },
    mapError,
    handler: async () => {
      const adminController = container.getAdminController();
      const [registrations, metrics] = await Promise.all([
        adminController.getRegistrationStats(30),
        adminController.getOverviewMetrics(),
      ]);

      return { metrics, registrations };
    },
  }),
  defineMcpTool({
    name: "admin_list_users",
    title: "List users",
    description:
      "Lists users with pagination and sorting, optionally filtered by search text, roles, ban status, email verification or creation date.",
    inputSchema: listInputSchema(ADMIN_USER_SORT_FIELDS).extend({
      role: z.array(roleKeyInputSchema).min(1).optional(),
      banned: z.boolean().optional(),
      emailVerified: z.boolean().optional(),
      createdAt: dateRangeInputSchema.optional(),
    }),
    annotations: { readOnlyHint: true },
    access: { feature: "users", level: "read" },
    mapError,
    handler: async (input) => container.getAdminController().listUsers(input),
  }),
  defineMcpTool({
    name: "admin_set_user_role",
    title: "Set user role",
    description:
      "Assigns a role to a user: admin, user or a custom role key from admin_list_roles.",
    inputSchema: userIdInputSchema.extend({
      role: roleKeyInputSchema,
    }),
    annotations: { idempotentHint: true },
    access: { feature: "users", level: "write" },
    mapError,
    handler: async (input, { user }) =>
      container
        .getAdminController()
        .setUserRole({ ...input, ...toActor(user) }),
  }),
  defineMcpTool({
    name: "admin_ban_user",
    title: "Ban user",
    description:
      "Bans a user and revokes their sessions, optionally until a given date.",
    inputSchema: userIdInputSchema.extend({
      reason: z.string().min(1).optional(),
      expiresAt: dateTimeString.optional(),
    }),
    annotations: { destructiveHint: true },
    access: { feature: "users", level: "write" },
    mapError,
    handler: async ({ expiresAt, ...input }, { user }) =>
      container.getAdminController().banUser({
        ...input,
        ...toActor(user),
        expiresAt: toOptionalDate(expiresAt),
      }),
  }),
  defineMcpTool({
    name: "admin_unban_user",
    title: "Unban user",
    description: "Lifts the ban of a user.",
    inputSchema: userIdInputSchema,
    annotations: { idempotentHint: true },
    access: { feature: "users", level: "write" },
    mapError,
    handler: async (input, { user }) =>
      container.getAdminController().unbanUser({ ...input, ...toActor(user) }),
  }),
  defineMcpTool({
    name: "admin_list_organizations",
    title: "List all organizations",
    description:
      "Lists every organization of the platform with pagination, sorting, optional search and creation date range.",
    inputSchema: listInputSchema(ADMIN_ORGANIZATION_SORT_FIELDS).extend({
      createdAt: dateRangeInputSchema.optional(),
    }),
    annotations: { readOnlyHint: true },
    access: { feature: "organizations", level: "read" },
    mapError,
    handler: async (input) =>
      container.getAdminController().listOrganizations(input),
  }),
  defineMcpTool({
    name: "admin_get_organization",
    title: "Get organization details",
    description:
      "Returns the details, members and invitations of any organization.",
    inputSchema: z.object({ organizationId: z.string().min(1) }),
    annotations: { readOnlyHint: true },
    access: { feature: "organizations", level: "read" },
    mapError,
    handler: async ({ organizationId }) =>
      container.getAdminController().getOrganizationDetails(organizationId),
  }),
  defineMcpTool({
    name: "admin_list_audit_logs",
    title: "List audit logs",
    description:
      "Lists audit log entries with pagination and sorting, optionally filtered by search text, actions, actor types, resource types, actor (user ID, name or email) and date range.",
    inputSchema: listInputSchema(ADMIN_AUDIT_LOG_SORT_FIELDS).extend({
      action: z.array(z.string().min(1)).min(1).optional(),
      actorType: z.array(z.string().min(1)).min(1).optional(),
      resourceType: z.array(z.string().min(1)).min(1).optional(),
      actor: z.string().min(1).optional(),
      createdAt: dateRangeInputSchema.optional(),
    }),
    annotations: { readOnlyHint: true },
    access: { feature: "audit-logs", level: "read" },
    mapError,
    handler: async (input) =>
      container.getAdminController().listAuditLogs(input),
  }),
  defineMcpTool({
    name: "admin_list_roles",
    title: "List roles",
    description:
      "Lists the system and custom roles with their access per feature and user counts.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
    access: { feature: "roles", level: "read" },
    mapError,
    handler: async () => container.getAdminController().listRoles(),
  }),
  defineMcpTool({
    name: "admin_create_role",
    title: "Create role",
    description:
      "Creates a custom role with an access level for each feature it can use.",
    inputSchema: saveRoleInputSchema,
    access: { feature: "roles", level: "write" },
    mapError,
    handler: async (input, { user }) =>
      container.getAdminController().createRole({ ...input, ...toActor(user) }),
  }),
  defineMcpTool({
    name: "admin_update_role",
    title: "Update role",
    description:
      "Replaces the name, description and access of a custom role, or the access of the user role.",
    inputSchema: saveRoleInputSchema,
    annotations: { idempotentHint: true },
    access: { feature: "roles", level: "write" },
    mapError,
    handler: async (input, { user }) =>
      container.getAdminController().updateRole({ ...input, ...toActor(user) }),
  }),
  defineMcpTool({
    name: "admin_delete_role",
    title: "Delete role",
    description: "Deletes a custom role that no user holds anymore.",
    inputSchema: z.object({ key: roleKeyInputSchema }),
    annotations: { destructiveHint: true },
    access: { feature: "roles", level: "write" },
    mapError,
    handler: async (input, { user }) =>
      container.getAdminController().deleteRole({ ...input, ...toActor(user) }),
  }),
];
