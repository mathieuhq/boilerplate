import { APIError } from "better-auth/api";
import {
  and,
  asc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  like,
  or,
} from "drizzle-orm";
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
import {
  auditLog,
  invitation,
  member,
  organization,
  subscription,
  user,
} from "@/lib/schema";
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
  (await db.$count(
    subscription,
    and(
      inArray(subscription.referenceId, organizationIds),
      eq(subscription.plan, "team"),
      inArray(subscription.status, PAID_STATUSES),
      or(
        isNull(subscription.periodEnd),
        gt(subscription.periodEnd, new Date()),
      ),
    ),
  )) > 0;

const findOwners = async (where: {
  userId?: string;
  organizationId?: string;
}) =>
  (
    await db
      .select({
        role: member.role,
        userId: member.userId,
        organizationId: member.organizationId,
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(
        and(
          where.userId === undefined
            ? undefined
            : eq(member.userId, where.userId),
          where.organizationId === undefined
            ? undefined
            : eq(member.organizationId, where.organizationId),
          like(member.role, `%${OWNER_ROLE}%`),
        ),
      )
      .orderBy(asc(organization.createdAt), asc(member.organizationId))
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

  await db.delete(organization).where(eq(organization.id, organizationId));

  throw APIError.fromStatus("FORBIDDEN", {
    code: "YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS",
    message: "You have reached the maximum number of organizations",
  });
};

const hasUsedFreeTrial = async (userId: string, organizationId: string) => {
  const owners = await findOwners({ organizationId });
  const userIds = [userId, ...owners.map((member) => member.userId)];

  const [owned, created] = await Promise.all([
    db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(
        and(
          inArray(member.userId, userIds),
          like(member.role, `%${OWNER_ROLE}%`),
        ),
      ),
    db
      .select({ resourceId: auditLog.resourceId })
      .from(auditLog)
      .where(
        and(
          inArray(auditLog.actorUserId, userIds),
          eq(auditLog.action, "organization.created"),
          isNotNull(auditLog.resourceId),
        ),
      ),
  ]);

  return (
    (await db.$count(
      subscription,
      and(
        inArray(subscription.referenceId, [
          organizationId,
          ...owned.map((row) => row.organizationId),
          ...created.flatMap((log) => log.resourceId ?? []),
        ]),
        or(
          isNotNull(subscription.trialStart),
          isNotNull(subscription.trialEnd),
          eq(subscription.status, "trialing"),
        ),
      ),
    )) > 0
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
    (await db.query.user.findFirst({
      where: eq(user.id, invitation.inviterId),
      columns: { role: true },
    })) ?? null,
  );

const cancelPendingInvitationsWithoutTeam = async (organizationId: string) => {
  if (await hasTeamSubscription([organizationId])) return;

  await db
    .update(invitation)
    .set({ status: "canceled" })
    .where(
      and(
        eq(invitation.organizationId, organizationId),
        eq(invitation.status, "pending"),
      ),
    );
};

export const syncTeamSeats = async (organizationId: string) => {
  try {
    const paid = await db.query.subscription.findFirst({
      where: and(
        eq(subscription.referenceId, organizationId),
        inArray(subscription.status, PAID_STATUSES),
        isNotNull(subscription.stripeSubscriptionId),
      ),
      columns: { plan: true, stripeSubscriptionId: true },
    });

    if (!paid?.stripeSubscriptionId) return;

    const [memberCount, stripeSubscription] = await Promise.all([
      db.$count(member, eq(member.organizationId, organizationId)),
      stripeClient.subscriptions.retrieve(paid.stripeSubscriptionId),
    ]);

    const change = getSeatItemChange({
      seatPriceId: config.teamSeatPriceId,
      seats: getBillableSeats(paid.plan, memberCount),
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
        (await db.$count(
          member,
          and(
            eq(member.organizationId, referenceId),
            eq(member.userId, user.id),
            inArray(member.role, BILLING_MANAGER_ROLES),
          ),
        )) > 0,
    },
  });
