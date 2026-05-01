import { z } from "zod";

const organizationSlugSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/);

export const updateOrganizationSchema = z.object({
  organizationId: z.string().min(1),
  logo: z.string().optional().nullable(),
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
