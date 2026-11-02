import { createServerFn } from "@tanstack/react-start";
import type { z } from "zod";

import type { OrganizationInvitationResponseDTO } from "@/features/organization/application/dto/organization-invitation-response.dto";
import type { OrganizationResponseDTO } from "@/features/organization/application/dto/organization-response.dto";
import { toOrganizationActionError } from "@/features/organization/interface/errors/organization-action-error.mapper";
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
