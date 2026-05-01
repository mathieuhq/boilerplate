"use server";

import { OrganizationOperationError } from "@/features/organization/application/errors/organization-operation.error";
import { OrganizationAccessDeniedError } from "@/features/organization/domain/errors/organization-access-denied.error";
import {
  acceptOrganizationInvitationSchema,
  cancelOrganizationInvitationSchema,
  createOrganizationSchema,
  inviteOrganizationMemberSchema,
  removeOrganizationMemberSchema,
  setActiveOrganizationSchema,
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

export const listOrganizationsAction = authAction.action(async () => {
  try {
    const organizationController = container.getOrganizationController();
    const organizations =
      await organizationController.listCurrentUserOrganizations();

    return ActionResponse.success(organizations);
  } catch (error) {
    throw toOrganizationActionError(error);
  }
});

export const createOrganizationAction = authAction
  .inputSchema(createOrganizationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const organizationController = container.getOrganizationController();
      const organization =
        await organizationController.createOrganization(parsedInput);

      return ActionResponse.success(organization);
    } catch (error) {
      throw toOrganizationActionError(error);
    }
  });

export const setActiveOrganizationAction = authAction
  .inputSchema(setActiveOrganizationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const organizationController = container.getOrganizationController();
      const organization =
        await organizationController.setActiveOrganization(parsedInput);

      return ActionResponse.success(organization);
    } catch (error) {
      throw toOrganizationActionError(error);
    }
  });

export const removeOrganizationMemberAction = authAction
  .inputSchema(removeOrganizationMemberSchema)
  .action(async ({ parsedInput }) => {
    try {
      const organizationController = container.getOrganizationController();
      const result = await organizationController.removeMember(parsedInput);

      return ActionResponse.success(result);
    } catch (error) {
      throw toOrganizationActionError(error);
    }
  });

export const cancelOrganizationInvitationAction = authAction
  .inputSchema(cancelOrganizationInvitationSchema)
  .action(async ({ parsedInput }) => {
    try {
      const organizationController = container.getOrganizationController();
      const result = await organizationController.cancelInvitation(parsedInput);

      return ActionResponse.success(result);
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

export const inviteOrganizationMemberAction = authAction
  .inputSchema(inviteOrganizationMemberSchema)
  .action(async ({ parsedInput }) => {
    try {
      const organizationController = container.getOrganizationController();
      const invitation = await organizationController.inviteMember(parsedInput);

      return ActionResponse.success(invitation);
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

    if (error.code === "ORGANIZATION_ALREADY_EXISTS")
      return ActionError.conflict(
        error.code,
        "An organization with this slug already exists",
      );

    if (error.code === "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS") {
      return ActionError.conflict(
        error.code,
        "You have reached the maximum number of organizations",
      );
    }

    if (error.code === "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION") {
      return ActionError.conflict(
        error.code,
        "This user is already a member of the organization",
      );
    }

    if (error.code === "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION") {
      return ActionError.conflict(
        error.code,
        "This user already has a pending invitation",
      );
    }

    if (error.code === "ORGANIZATION_MEMBERSHIP_LIMIT_REACHED") {
      return ActionError.conflict(
        error.code,
        "The organization membership limit has been reached",
      );
    }

    if (error.code === "INVITATION_LIMIT_REACHED") {
      return ActionError.conflict(
        error.code,
        "The organization invitation limit has been reached",
      );
    }

    if (error.code === "INVITATION_NOT_FOUND")
      return ActionError.notFound("Invitation", "Invitation not found");

    if (
      error.code === "YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION" ||
      error.code === "USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION" ||
      error.code ===
        "YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION" ||
      error.code === "YOU_ARE_NOT_ALLOWED_TO_INVITE_USER_WITH_THIS_ROLE" ||
      error.code === "YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION" ||
      error.code === "YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER" ||
      error.code === "YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION" ||
      error.code === "YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION" ||
      error.code === "MEMBER_NOT_FOUND"
    ) {
      return ActionError.forbidden(error.message);
    }

    if (
      error.code === "YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER" ||
      error.code === "YOU_CANNOT_LEAVE_THE_ORGANIZATION_WITHOUT_AN_OWNER"
    ) {
      return ActionError.conflict(
        error.code,
        "The organization must keep at least one owner",
      );
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
