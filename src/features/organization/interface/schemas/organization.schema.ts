import { z } from "zod";

export const updateOrganizationSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  logo: z.string().optional().nullable(),
});

export const acceptOrganizationInvitationSchema = z.object({
  invitationId: z.string().min(1),
});
