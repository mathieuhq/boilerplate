import { z } from "zod";

import { toAdminActionError } from "@/features/admin/interface/errors/admin-action-error.mapper";
import { container } from "@/shared/infrastructure/di/container";

import { defineMcpTool } from "../tool";

const paginationInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

const userIdInputSchema = z.object({
  userId: z.string().min(1),
});

const dateTimeString = z.iso
  .datetime({ offset: true })
  .describe("ISO 8601 date-time");

const mapError = toAdminActionError;

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
    adminOnly: true,
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
      "Lists users with pagination, optionally filtered by search text, role, ban status or email verification.",
    inputSchema: paginationInputSchema.extend({
      search: z.string().min(1).optional(),
      role: z.enum(["user", "admin"]).optional(),
      banned: z.boolean().optional(),
      emailVerified: z.boolean().optional(),
    }),
    annotations: { readOnlyHint: true },
    adminOnly: true,
    mapError,
    handler: async (input) => container.getAdminController().listUsers(input),
  }),
  defineMcpTool({
    name: "admin_set_user_role",
    title: "Set user role",
    description: "Promotes a user to admin or demotes an admin to user.",
    inputSchema: userIdInputSchema.extend({
      role: z.enum(["user", "admin"]),
    }),
    annotations: { idempotentHint: true },
    adminOnly: true,
    mapError,
    handler: async (input, { user }) =>
      container
        .getAdminController()
        .setUserRole({ ...input, actorUserId: user.id }),
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
    adminOnly: true,
    mapError,
    handler: async ({ expiresAt, ...input }, { user }) =>
      container.getAdminController().banUser({
        ...input,
        actorUserId: user.id,
        expiresAt: toOptionalDate(expiresAt),
      }),
  }),
  defineMcpTool({
    name: "admin_unban_user",
    title: "Unban user",
    description: "Lifts the ban of a user.",
    inputSchema: userIdInputSchema,
    annotations: { idempotentHint: true },
    adminOnly: true,
    mapError,
    handler: async (input, { user }) =>
      container
        .getAdminController()
        .unbanUser({ ...input, actorUserId: user.id }),
  }),
  defineMcpTool({
    name: "admin_list_organizations",
    title: "List all organizations",
    description:
      "Lists every organization of the platform with pagination and optional search.",
    inputSchema: paginationInputSchema.extend({
      search: z.string().min(1).optional(),
    }),
    annotations: { readOnlyHint: true },
    adminOnly: true,
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
    adminOnly: true,
    mapError,
    handler: async ({ organizationId }) =>
      container.getAdminController().getOrganizationDetails(organizationId),
  }),
  defineMcpTool({
    name: "admin_list_audit_logs",
    title: "List audit logs",
    description:
      "Lists audit log entries with pagination, optionally filtered by action, actor, resource type and date range.",
    inputSchema: paginationInputSchema.extend({
      action: z.string().min(1).optional(),
      actorUserId: z.string().min(1).optional(),
      resourceType: z.string().min(1).optional(),
      from: dateTimeString.optional(),
      to: dateTimeString.optional(),
    }),
    annotations: { readOnlyHint: true },
    adminOnly: true,
    mapError,
    handler: async ({ from, to, ...input }) =>
      container.getAdminController().listAuditLogs({
        ...input,
        from: toOptionalDate(from),
        to: toOptionalDate(to),
      }),
  }),
];
