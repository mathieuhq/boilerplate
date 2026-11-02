import { ActionError } from "@/lib/errors/action-error";

import { OrganizationOperationError } from "../../application/errors/organization-operation.error";
import { OrganizationAccessDeniedError } from "../../domain/errors/organization-access-denied.error";

export function toOrganizationActionError(error: unknown): unknown {
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

  return error;
}
