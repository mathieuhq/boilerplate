import { z } from "zod";

import {
  ACCESS_FEATURE_KEYS,
  ACCESS_LEVELS,
} from "@/shared/domain/access-control";
import {
  createListQuerySchema,
  listFilter,
} from "@/shared/interface/schemas/list-query.schema";

import {
  ADMIN_AUDIT_LOG_SORT_FIELDS,
  ADMIN_ORGANIZATION_SORT_FIELDS,
  ADMIN_USER_SORT_FIELDS,
} from "../../domain/admin-list";
import { ROLE_KEY_PATTERN } from "../../domain/roles";

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

const roleKeySchema = z.string().trim().regex(ROLE_KEY_PATTERN);

export const listAdminUsersSchema = createListQuerySchema({
  sortFields: ADMIN_USER_SORT_FIELDS,
  filters: {
    role: listFilter.multiSelect(),
    banned: listFilter.boolean(),
    emailVerified: listFilter.boolean(),
    createdAt: listFilter.dateRange(),
  },
});

export const setAdminUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: roleKeySchema,
});

export const banAdminUserSchema = z.object({
  userId: z.string().min(1),
  reason: optionalString,
  expiresAt: optionalDate,
});

export const unbanAdminUserSchema = z.object({
  userId: z.string().min(1),
});

export const impersonateAdminUserSchema = z.object({
  userId: z.string().min(1),
});

export const listAdminOrganizationsSchema = createListQuerySchema({
  sortFields: ADMIN_ORGANIZATION_SORT_FIELDS,
  filters: {
    createdAt: listFilter.dateRange(),
  },
});

export const listAdminAuditLogsSchema = createListQuerySchema({
  sortFields: ADMIN_AUDIT_LOG_SORT_FIELDS,
  filters: {
    action: listFilter.multiSelect(),
    actorType: listFilter.multiSelect(),
    resourceType: listFilter.multiSelect(),
    actor: listFilter.text(),
    createdAt: listFilter.dateRange(),
  },
});

export const saveAdminRoleSchema = z.object({
  key: roleKeySchema,
  name: z.string().trim().min(2).max(64),
  description: z.preprocess(emptyToUndefined, z.string().max(280).optional()),
  access: z.partialRecord(z.enum(ACCESS_FEATURE_KEYS), z.enum(ACCESS_LEVELS)),
});

export const deleteAdminRoleSchema = z.object({
  key: roleKeySchema,
});
