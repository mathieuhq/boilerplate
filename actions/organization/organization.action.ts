"use server";

import { z } from "zod";

import { authAction } from "@/lib/actions/safe-actions";
import { db } from "@/lib/db";
import { ActionError } from "@/lib/errors/action-error";
import { ActionResponse } from "@/shared/infrastructure/http";

const updateOrganizationSchema = z.object({
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

export const updateOrganizationAction = authAction
  .inputSchema(updateOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { organizationId, name, slug, logo } = parsedInput;

    const member = await db.member.findFirst({
      where: {
        organizationId,
        userId: ctx.user.id,
        role: { in: ["owner", "admin"] },
      },
    });

    if (!member) {
      throw ActionError.forbidden(
        "You must be an owner or admin to update this organization",
      );
    }

    if (slug) {
      const existingOrg = await db.organization.findFirst({
        where: {
          slug,
          id: { not: organizationId },
        },
      });

      if (existingOrg) {
        throw ActionError.conflict("SLUG_TAKEN", "This slug is already taken");
      }
    }

    const updatedOrg = await db.organization.update({
      where: { id: organizationId },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(logo !== undefined && { logo }),
      },
    });

    return ActionResponse.success(updatedOrg);
  });
