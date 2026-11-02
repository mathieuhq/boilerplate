import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";

import type { RecordOrganizationActivityInput } from "@/features/organization/application/use-cases/record-organization-activity.use-case";
import { container } from "@/shared/infrastructure/di/container";

import { logger } from "./logger";

type ActivityRecord = Record<string, unknown>;

type OrganizationActivity = Omit<
  RecordOrganizationActivityInput,
  "actorUserId" | "impersonatedBy"
>;

type ActivityMapper = (
  returned: ActivityRecord,
  body: ActivityRecord,
) => OrganizationActivity | null;

const ACTIVITY_MAPPERS: Record<string, ActivityMapper> = {
  "/organization/create": (organization) => ({
    action: "organization.created",
    organizationId: text(organization.id),
    resourceType: "organization",
    resourceId: text(organization.id),
    metadata: {
      name: text(organization.name),
      slug: text(organization.slug),
    },
  }),
  "/organization/update": (organization, body) => ({
    action: "organization.updated",
    organizationId: text(organization.id),
    resourceType: "organization",
    resourceId: text(organization.id),
    metadata: {
      fields: Object.keys(record(body.data)).sort(),
    },
  }),
  "/organization/invite-member": (invitation) =>
    invitationActivity("organization.invitation.created", invitation),
  "/organization/cancel-invitation": (invitation) =>
    invitationActivity("organization.invitation.canceled", invitation),
  "/organization/accept-invitation": (returned) =>
    invitationActivity(
      "organization.invitation.accepted",
      record(returned.invitation),
    ),
  "/organization/reject-invitation": (returned) =>
    invitationActivity(
      "organization.invitation.rejected",
      record(returned.invitation),
    ),
  "/organization/remove-member": (returned) =>
    memberActivity("organization.member.removed", record(returned.member)),
  "/organization/update-member-role": (member) =>
    memberActivity("organization.member.role-updated", member),
  "/organization/leave": (member) =>
    memberActivity("organization.member.left", member),
};

export const organizationActivityLog = () =>
  ({
    id: "organization-activity-log",
    hooks: {
      after: [
        {
          matcher: (context) =>
            Boolean(
              context.path && Object.hasOwn(ACTIVITY_MAPPERS, context.path),
            ),
          handler: createAuthMiddleware(async (ctx) => {
            const returned = ctx.context.returned;

            if (!isRecord(returned)) return;

            const activity = ACTIVITY_MAPPERS[ctx.path](
              returned,
              record(ctx.body),
            );

            if (!activity) return;

            try {
              const session =
                ctx.context.session ?? (await getSessionFromCtx(ctx));

              if (!session) return;

              await container.getOrganizationActivityController().record({
                ...activity,
                actorUserId: session.user.id,
                impersonatedBy: text(
                  (session.session as { impersonatedBy?: unknown })
                    .impersonatedBy,
                ),
              });
            } catch (error) {
              logger.error("Error recording organization activity", {
                error,
                path: ctx.path,
              });
            }
          }),
        },
      ],
    },
  }) satisfies BetterAuthPlugin;

function invitationActivity(
  action: OrganizationActivity["action"],
  invitation: ActivityRecord,
): OrganizationActivity | null {
  if (!invitation.id) return null;

  return {
    action,
    organizationId: text(invitation.organizationId),
    resourceType: "invitation",
    resourceId: text(invitation.id),
    metadata: {
      email: text(invitation.email),
      role: text(invitation.role),
    },
  };
}

function memberActivity(
  action: OrganizationActivity["action"],
  member: ActivityRecord,
): OrganizationActivity | null {
  if (!member.id) return null;

  return {
    action,
    organizationId: text(member.organizationId),
    resourceType: "member",
    resourceId: text(member.id),
    metadata: {
      userId: text(member.userId),
      role: text(member.role),
    },
  };
}

function isRecord(value: unknown): value is ActivityRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Response) &&
    !(value instanceof Error)
  );
}

function record(value: unknown): ActivityRecord {
  return isRecord(value) ? value : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}
