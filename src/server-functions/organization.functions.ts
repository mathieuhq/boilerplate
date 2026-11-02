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
import { userAction } from "@/lib/actions/safe-actions";
import { container } from "@/shared/infrastructure/di/container";
import type { ActionResponse as ActionResponseType } from "@/shared/infrastructure/http/api-response";

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

const updateOrganizationServerFn = createServerFn({ method: "POST" })
  .validator(updateOrganizationSchema)
  .handler(async ({ data }) =>
    userAction(
      async () =>
        container.getOrganizationController().updateOrganization(data),
      toOrganizationActionError,
    ),
  );

const listOrganizationsServerFn = createServerFn({ method: "GET" }).handler(
  async () =>
    userAction(
      async () =>
        container.getOrganizationController().listCurrentUserOrganizations(),
      toOrganizationActionError,
    ),
);

const createOrganizationServerFn = createServerFn({ method: "POST" })
  .validator(createOrganizationSchema)
  .handler(async ({ data }) =>
    userAction(
      async () =>
        container.getOrganizationController().createOrganization(data),
      toOrganizationActionError,
    ),
  );

const setActiveOrganizationServerFn = createServerFn({ method: "POST" })
  .validator(setActiveOrganizationSchema)
  .handler(async ({ data }) =>
    userAction(
      async () =>
        container.getOrganizationController().setActiveOrganization(data),
      toOrganizationActionError,
    ),
  );

const removeOrganizationMemberServerFn = createServerFn({ method: "POST" })
  .validator(removeOrganizationMemberSchema)
  .handler(async ({ data }) =>
    userAction(
      async () => container.getOrganizationController().removeMember(data),
      toOrganizationActionError,
    ),
  );

const cancelOrganizationInvitationServerFn = createServerFn({ method: "POST" })
  .validator(cancelOrganizationInvitationSchema)
  .handler(async ({ data }) =>
    userAction(
      async () => container.getOrganizationController().cancelInvitation(data),
      toOrganizationActionError,
    ),
  );

const acceptOrganizationInvitationServerFn = createServerFn({ method: "POST" })
  .validator(acceptOrganizationInvitationSchema)
  .handler(async ({ data }) =>
    userAction(
      async () =>
        container
          .getOrganizationController()
          .acceptInvitation(data.invitationId),
      toOrganizationActionError,
    ),
  );

const inviteOrganizationMemberServerFn = createServerFn({ method: "POST" })
  .validator(inviteOrganizationMemberSchema)
  .handler(async ({ data }) =>
    userAction(
      async () => container.getOrganizationController().inviteMember(data),
      toOrganizationActionError,
    ),
  );

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
