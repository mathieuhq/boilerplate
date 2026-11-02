import { z } from "zod";

import { toOrganizationActionError } from "@/features/organization/interface/errors/organization-action-error.mapper";
import {
  acceptOrganizationInvitationSchema,
  cancelOrganizationInvitationSchema,
  createOrganizationSchema,
  inviteOrganizationMemberSchema,
  removeOrganizationMemberSchema,
  updateOrganizationSchema,
} from "@/features/organization/interface/schemas/organization.schema";
import { container } from "@/shared/infrastructure/di/container";

import { defineMcpTool } from "../tool";

const organizationIdInputSchema = z.object({
  organizationId: z.string().min(1),
});

const mapError = toOrganizationActionError;

export const organizationTools = [
  defineMcpTool({
    name: "list_organizations",
    title: "List organizations",
    description: "Lists the organizations the signed-in user belongs to.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
    mapError,
    handler: async () =>
      container.getOrganizationController().listCurrentUserOrganizations(),
  }),
  defineMcpTool({
    name: "create_organization",
    title: "Create organization",
    description:
      "Creates an organization owned by the signed-in user. The slug must be lowercase letters, digits and dashes.",
    inputSchema: createOrganizationSchema,
    mapError,
    handler: async (input) =>
      container.getOrganizationController().createOrganization(input),
  }),
  defineMcpTool({
    name: "update_organization",
    title: "Update organization",
    description:
      "Updates the name or slug of an organization the signed-in user can manage.",
    inputSchema: updateOrganizationSchema,
    annotations: { idempotentHint: true },
    mapError,
    handler: async (input) =>
      container.getOrganizationController().updateOrganization(input),
  }),
  defineMcpTool({
    name: "list_organization_members",
    title: "List organization members",
    description: "Lists the members of an organization and their roles.",
    inputSchema: organizationIdInputSchema,
    annotations: { readOnlyHint: true },
    mapError,
    handler: async (input) =>
      container.getOrganizationController().listMembers(input),
  }),
  defineMcpTool({
    name: "remove_organization_member",
    title: "Remove organization member",
    description:
      "Removes a member from an organization. Use list_organization_members to find the memberId.",
    inputSchema: removeOrganizationMemberSchema,
    annotations: { destructiveHint: true },
    mapError,
    handler: async (input) =>
      container.getOrganizationController().removeMember(input),
  }),
  defineMcpTool({
    name: "list_organization_invitations",
    title: "List organization invitations",
    description: "Lists the invitations of an organization.",
    inputSchema: organizationIdInputSchema,
    annotations: { readOnlyHint: true },
    mapError,
    handler: async (input) =>
      container.getOrganizationController().listInvitations(input),
  }),
  defineMcpTool({
    name: "invite_organization_member",
    title: "Invite organization member",
    description:
      "Sends an email invitation to join an organization as admin or member.",
    inputSchema: inviteOrganizationMemberSchema,
    annotations: { openWorldHint: true },
    mapError,
    handler: async (input) =>
      container.getOrganizationController().inviteMember(input),
  }),
  defineMcpTool({
    name: "cancel_organization_invitation",
    title: "Cancel organization invitation",
    description: "Cancels a pending organization invitation.",
    inputSchema: cancelOrganizationInvitationSchema,
    annotations: { destructiveHint: true },
    mapError,
    handler: async (input) =>
      container.getOrganizationController().cancelInvitation(input),
  }),
  defineMcpTool({
    name: "accept_organization_invitation",
    title: "Accept organization invitation",
    description:
      "Accepts an invitation sent to the signed-in user's email address.",
    inputSchema: acceptOrganizationInvitationSchema,
    mapError,
    handler: async ({ invitationId }) =>
      container.getOrganizationController().acceptInvitation(invitationId),
  }),
];
