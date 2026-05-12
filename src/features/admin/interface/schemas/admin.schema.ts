import { z } from "zod";

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string" || !value.trim()) return undefined;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}, z.date().optional());

export const listAdminUsersSchema = paginationSchema.extend({
  search: optionalString,
  role: z.enum(["user", "admin"]).optional(),
  banned: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

export const setAdminUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["user", "admin"]),
});

export const banAdminUserSchema = z.object({
  userId: z.string().min(1),
  reason: optionalString,
  expiresAt: optionalDate,
});

export const unbanAdminUserSchema = z.object({
  userId: z.string().min(1),
});

export const listAdminOrganizationsSchema = paginationSchema.extend({
  search: optionalString,
  organizationId: optionalString,
});

export const listAdminAuditLogsSchema = paginationSchema.extend({
  action: optionalString,
  actorUserId: optionalString,
  resourceType: optionalString,
  from: optionalString,
  to: optionalString,
});
