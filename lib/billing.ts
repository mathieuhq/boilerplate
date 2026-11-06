import { APIError } from "better-auth/api";
import Stripe from "stripe";

import { ADMIN_ROLE } from "@/features/admin/domain/roles";
import {
  hasOrganizationRole,
  hasReachedOwnedOrganizationLimit,
} from "@/features/billing/domain/organization-limits.policy";
import {
  getBillableSeats,
  getSeatItemChange,
} from "@/features/billing/domain/team-seats.policy";
import { db } from "@/lib/db";
import { getStripeConfig } from "@/lib/env";
import { logger } from "@/lib/logger";
import { stripe } from "@better-auth/stripe";

const OWNER_ROLE = "owner";

const FREE_TRIAL = { days: 7 };

const BILLING_MANAGER_ROLES = [OWNER_ROLE, "admin"];

const PAID_STATUSES = ["active", "trialing"];

type BillingActor = { id?: string; role?: string | null };

const config = getStripeConfig();

const stripeClient = new Stripe(config.secretKey);

const isPlatformAdmin = (user: BillingActor | null) =>
  user?.role === ADMIN_ROLE;

const hasTeamSubscription = async (organizationIds: string[]) =>
  (await db.subscription.count({
    where: {
      referenceId: { in: organizationIds },
      plan: "team",
      status: { in: PAID_STATUSES },
      OR: [{ periodEnd: null }, { periodEnd: { gt: new Date() } }],
    },
  })) > 0;

const findOwners = async (where: {
  userId?: string;
  organizationId?: string;
}) =>
  (
    await db.member.findMany({
      where: { ...where, role: { contains: OWNER_ROLE } },
      select: { role: true, userId: true, organizationId: true },
      orderBy: [
        { organization: { createdAt: "asc" } },
        { organizationId: "asc" },
      ],
    })
  ).filter((member) => hasOrganizationRole(member.role, OWNER_ROLE));

const findOwnedOrganizationIds = async (userId: string) =>
  (await findOwners({ userId })).map((member) => member.organizationId);

export const hasReachedOrganizationLimit = async (
  user: BillingActor & { id: string },
) => {
  if (isPlatformAdmin(user)) return false;

  const owned = await findOwnedOrganizationIds(user.id);

  return hasReachedOwnedOrganizationLimit({
    ownedCount: owned.length,
    ownsTeamOrganization: await hasTeamSubscription(owned),
  });
};

export const assertOrganizationWithinLimit = async (
  user: BillingActor & { id: string },
  organizationId: string,
) => {
  if (isPlatformAdmin(user)) return;

  const owned = await findOwnedOrganizationIds(user.id);

  const position = owned.indexOf(organizationId);

  if (
    position === -1 ||
    !hasReachedOwnedOrganizationLimit({
      ownedCount: position,
      ownsTeamOrganization: await hasTeamSubscription(owned),
    })
  )
    return;

  await db.organization.delete({ where: { id: organizationId } });

  throw APIError.fromStatus("FORBIDDEN", {
    code: "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS",
    message: "You have reached the maximum number of organizations",
  });
};

const hasUsedFreeTrial = async (userId: string, organizationId: string) => {
  const owners = await findOwners({ organizationId });
  const userIds = [userId, ...owners.map((member) => member.userId)];

  const [owned, created] = await Promise.all([
    db.member.findMany({
      where: { userId: { in: userIds }, role: { contains: OWNER_ROLE } },
      select: { organizationId: true },
    }),
    db.auditLog.findMany({
      where: {
        actorUserId: { in: userIds },
        action: "organization.created",
        resourceId: { not: null },
      },
      select: { resourceId: true },
    }),
  ]);

  return (
    (await db.subscription.count({
      where: {
        referenceId: {
          in: [
            organizationId,
            ...owned.map((member) => member.organizationId),
            ...created.flatMap((log) => log.resourceId ?? []),
          ],
        },
        OR: [
          { trialStart: { not: null } },
          { trialEnd: { not: null } },
          { status: "trialing" },
        ],
      },
    })) > 0
  );
};

export const canOrganizationAddMembers = async (
  organizationId: string,
  actor: BillingActor | null,
) => isPlatformAdmin(actor) || hasTeamSubscription([organizationId]);

export const assertOrganizationCanAddMembers = async (
  organizationId: string,
  actor: BillingActor | null,
) => {
  if (await canOrganizationAddMembers(organizationId, actor)) return;

  throw APIError.fromStatus("FORBIDDEN", {
    code: "TEAM_PLAN_REQUIRED",
    message: "Upgrade to the Team plan to add members",
  });
};

export const assertInvitationCanBeAccepted = async (invitation: {
  organizationId: string;
  inviterId: string;
}) =>
  assertOrganizationCanAddMembers(
    invitation.organizationId,
    await db.user.findUnique({
      where: { id: invitation.inviterId },
      select: { role: true },
    }),
  );

const cancelPendingInvitationsWithoutTeam = async (organizationId: string) => {
  if (await hasTeamSubscription([organizationId])) return;

  await db.invitation.updateMany({
    where: { organizationId, status: "pending" },
    data: { status: "canceled" },
  });
};

export const syncTeamSeats = async (organizationId: string) => {
  try {
    const subscription = await db.subscription.findFirst({
      where: {
        referenceId: organizationId,
        status: { in: PAID_STATUSES },
        stripeSubscriptionId: { not: null },
      },
      select: { plan: true, stripeSubscriptionId: true },
    });

    if (!subscription?.stripeSubscriptionId) return;

    const [memberCount, stripeSubscription] = await Promise.all([
      db.member.count({ where: { organizationId } }),
      stripeClient.subscriptions.retrieve(subscription.stripeSubscriptionId),
    ]);

    const change = getSeatItemChange({
      seatPriceId: config.teamSeatPriceId,
      seats: getBillableSeats(subscription.plan, memberCount),
      item: stripeSubscription.items.data.find(
        (item) => item.price.id === config.teamSeatPriceId,
      ),
    });

    if (!change) return;

    await stripeClient.subscriptions.update(stripeSubscription.id, {
      items: [change],
      proration_behavior: "create_prorations",
    });
  } catch (error) {
    logger.error("Failed to sync Team seats", { error, organizationId });
  }
};

const handleSubscriptionChange = async (organizationId: string) => {
  await syncTeamSeats(organizationId);

  try {
    await cancelPendingInvitationsWithoutTeam(organizationId);
  } catch (error) {
    logger.error("Failed to cancel invitations after leaving Team", {
      error,
      organizationId,
    });
  }
};

export const createBillingPlugin = () =>
  stripe({
    stripeClient,
    stripeWebhookSecret: config.webhookSecret,
    organization: { enabled: true },
    subscription: {
      enabled: true,
      plans: [
        { name: "pro", priceId: config.proPriceId, freeTrial: FREE_TRIAL },
        { name: "team", priceId: config.teamPriceId, freeTrial: FREE_TRIAL },
      ],
      getCheckoutSessionParams: async ({ user, subscription }) =>
        (await hasUsedFreeTrial(user.id, subscription.referenceId))
          ? { params: { subscription_data: { trial_period_days: undefined } } }
          : {},
      onSubscriptionComplete: async ({ subscription }) =>
        handleSubscriptionChange(subscription.referenceId),
      onSubscriptionUpdate: async ({ subscription }) =>
        handleSubscriptionChange(subscription.referenceId),
      onSubscriptionDeleted: async ({ subscription }) =>
        handleSubscriptionChange(subscription.referenceId),
      authorizeReference: async ({ user, referenceId }) =>
        (await db.member.count({
          where: {
            organizationId: referenceId,
            userId: user.id,
            role: { in: BILLING_MANAGER_ROLES },
          },
        })) > 0,
    },
  });
