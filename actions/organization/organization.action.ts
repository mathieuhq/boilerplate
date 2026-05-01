"use server";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import { OrganizationAccessDeniedError } from "@/features/organization/domain/errors/organization-access-denied.error";
import {
  acceptOrganizationInvitationSchema,
  updateOrganizationSchema,
} from "@/features/organization/interface/schemas/organization.schema";
import { authAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { container } from "@/shared/infrastructure/di/container";
import { ActionResponse } from "@/shared/infrastructure/http";

export const updateOrganizationAction = authAction
  .inputSchema(updateOrganizationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const organizationController = container.getOrganizationController();
      const organization =
        await organizationController.updateOrganization(parsedInput);

      return ActionResponse.success(organization);
    } catch (error) {
      throw toOrganizationActionError(error);
    }
  });

export const acceptOrganizationInvitationAction = authAction
  .inputSchema(acceptOrganizationInvitationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const organizationController = container.getOrganizationController();
      const result = await organizationController.acceptInvitation(
        parsedInput.invitationId,
      );

      return ActionResponse.success(result);
    } catch (error) {
      throw toOrganizationActionError(error);
    }
  });

function toOrganizationActionError(error: unknown): ActionError {
  if (error instanceof OrganizationAccessDeniedError) {
    return ActionError.forbidden(error.message);
  }

  if (error instanceof OrganizationOperationError) {
    if (error.code === "ORGANIZATION_SLUG_ALREADY_TAKEN")
      return ActionError.conflict("SLUG_TAKEN", "This slug is already taken");

    if (
      error.code === "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION" ||
      error.code === "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION"
    ) {
      return ActionError.forbidden(error.message);
    }

    return ActionError.badRequest(error.code, error.message);
  }

  if (error instanceof Error)
    return ActionError.badRequest("ORGANIZATION_ERROR", error.message);

  return ActionError.badRequest(
    "ORGANIZATION_ERROR",
    "Organization operation failed",
  );
}
