import { z } from "zod";

import {
  createListQuerySchema,
  listFilter,
} from "@/shared/interface/schemas/list-query.schema";

import { ORGANIZATION_AUDIT_LOG_SORT_FIELDS } from "../../domain/organization-activity";

const organizationSlugSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/);

export const updateOrganizationSchema = z.object({
  organizationId: z.string().min(1),
  slug: organizationSlugSchema.optional(),
  name: z.string().min(2).max(100).optional(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: organizationSlugSchema,
});

export const setActiveOrganizationSchema = z.object({
  organizationId: z.string().min(1),
});

export const removeOrganizationMemberSchema = z.object({
  organizationId: z.string().min(1),
  memberId: z.string().min(1),
});

export const cancelOrganizationInvitationSchema = z.object({
  invitationId: z.string().min(1),
});

export const acceptOrganizationInvitationSchema = z.object({
  invitationId: z.string().min(1),
});

export const inviteOrganizationMemberSchema = z.object({
  role: z.enum(["admin", "member"]),
  organizationId: z.string().min(1),
  email: z.email().transform((email) => email.toLowerCase()),
});

export const listOrganizationAuditLogsSchema = createListQuerySchema({
  sortFields: ORGANIZATION_AUDIT_LOG_SORT_FIELDS,
  filters: {
    action: listFilter.multiSelect(),
    createdAt: listFilter.dateRange(),
  },
});
