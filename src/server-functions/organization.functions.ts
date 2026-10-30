import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { OrganizationInvitationResponseDTO } from "@/features/organization/application/dto/organization-invitation-response.dto";
import type { OrganizationResponseDTO } from "@/features/organization/application/dto/organization-response.dto";
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
import { getRequiredActionUser } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { container } from "@/shared/infrastructure/di/container";
import {
  ActionResponse,
  type ActionResponse as ActionResponseType,
} from "@/shared/infrastructure/http/api-response";

import { actionErrorResponse } from "./action-errors.server";

type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
type SetActiveOrganizationInput = z.infer<typeof setActiveOrganizationSchema>;
type RemoveOrganizationMemberInput = z.infer<
  typeof removeOrganizationMemberSchema
>;
type CancelOrganizationInvitationInput = z.infer<
  typeof cancelOrganizationInvitationSchema
>;
type AcceptOrganizationInvitationInput = z.infer<
  typeof acceptOrganizationInvitationSchema
>;
type InviteOrganizationMemberInput = z.infer<
  typeof inviteOrganizationMemberSchema
>;
type RemoveOrganizationMemberOutput = { removed: true };
type CancelOrganizationInvitationOutput = { canceled: true };
type AcceptOrganizationInvitationOutput = { accepted: true };

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

function organizationActionErrorResponse(error: unknown) {
  return actionErrorResponse(toOrganizationActionError(error));
}

const updateOrganizationServerFn = createServerFn({ method: "POST" })
  .validator(updateOrganizationSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const organization =
        await organizationController.updateOrganization(data);

      return ActionResponse.success(organization);
    } catch (error) {
      return organizationActionErrorResponse(error);
    }
  });

const listOrganizationsServerFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const organizations =
        await organizationController.listCurrentUserOrganizations();

      return ActionResponse.success(organizations);
    } catch (error) {
      return organizationActionErrorResponse(error);
    }
  },
);

const createOrganizationServerFn = createServerFn({ method: "POST" })
  .validator(createOrganizationSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const organization =
        await organizationController.createOrganization(data);

      return ActionResponse.success(organization);
    } catch (error) {
      return organizationActionErrorResponse(error);
    }
  });

const setActiveOrganizationServerFn = createServerFn({ method: "POST" })
  .validator(setActiveOrganizationSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const organization =
        await organizationController.setActiveOrganization(data);

      return ActionResponse.success(organization);
    } catch (error) {
      return organizationActionErrorResponse(error);
    }
  });

const removeOrganizationMemberServerFn = createServerFn({ method: "POST" })
  .validator(removeOrganizationMemberSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const result = await organizationController.removeMember(data);

      return ActionResponse.success(result);
    } catch (error) {
      return organizationActionErrorResponse(error);
    }
  });

const cancelOrganizationInvitationServerFn = createServerFn({ method: "POST" })
  .validator(cancelOrganizationInvitationSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const result = await organizationController.cancelInvitation(data);

      return ActionResponse.success(result);
    } catch (error) {
      return organizationActionErrorResponse(error);
    }
  });

const acceptOrganizationInvitationServerFn = createServerFn({ method: "POST" })
  .validator(acceptOrganizationInvitationSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const result = await organizationController.acceptInvitation(
        data.invitationId,
      );

      return ActionResponse.success(result);
    } catch (error) {
      return organizationActionErrorResponse(error);
    }
  });

const inviteOrganizationMemberServerFn = createServerFn({ method: "POST" })
  .validator(inviteOrganizationMemberSchema)
  .handler(async ({ data }) => {
    try {
      await getRequiredActionUser();
      const organizationController = container.getOrganizationController();
      const invitation = await organizationController.inviteMember(data);

      return ActionResponse.success(invitation);
    } catch (error) {
      return organizationActionErrorResponse(error);
    }
  });

export async function updateOrganizationAction(data: UpdateOrganizationInput) {
  return updateOrganizationServerFn({ data }) as Promise<
    ActionResponseType<OrganizationResponseDTO>
  >;
}

export async function listOrganizationsAction() {
  return listOrganizationsServerFn() as Promise<
    ActionResponseType<OrganizationResponseDTO[]>
  >;
}

export async function createOrganizationAction(data: CreateOrganizationInput) {
  return createOrganizationServerFn({ data }) as Promise<
    ActionResponseType<OrganizationResponseDTO>
  >;
}

export async function setActiveOrganizationAction(
  data: SetActiveOrganizationInput,
) {
  return setActiveOrganizationServerFn({ data }) as Promise<
    ActionResponseType<OrganizationResponseDTO>
  >;
}

export async function removeOrganizationMemberAction(
  data: RemoveOrganizationMemberInput,
) {
  return removeOrganizationMemberServerFn({ data }) as Promise<
    ActionResponseType<RemoveOrganizationMemberOutput>
  >;
}

export async function cancelOrganizationInvitationAction(
  data: CancelOrganizationInvitationInput,
) {
  return cancelOrganizationInvitationServerFn({ data }) as Promise<
    ActionResponseType<CancelOrganizationInvitationOutput>
  >;
}

export async function acceptOrganizationInvitationAction(
  data: AcceptOrganizationInvitationInput,
) {
  return acceptOrganizationInvitationServerFn({ data }) as Promise<
    ActionResponseType<AcceptOrganizationInvitationOutput>
  >;
}

export async function inviteOrganizationMemberAction(
  data: InviteOrganizationMemberInput,
) {
  return inviteOrganizationMemberServerFn({ data }) as Promise<
    ActionResponseType<OrganizationInvitationResponseDTO>
  >;
}
