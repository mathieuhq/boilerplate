import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { getStorageObjectKey, STORAGE_PREFIXES } from "@/lib/storage";

import type { UserDataSnapshot } from "../../application/dto/user-data-snapshot.dto";
import type { IUserDataCollectorPort } from "../../application/ports/user-data-collector.port";

type JsonValue = UserDataSnapshot["notifications"][number]["data"];

const STORED_FILE_PREFIXES = [`${STORAGE_PREFIXES.userAvatars}/`, "uploads/"];

const organizationSelect = {
  select: { id: true, name: true, slug: true },
} as const;

const invitationSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  expiresAt: true,
  createdAt: true,
  organization: organizationSelect,
} as const satisfies Prisma.InvitationSelect;

export const USER_DATA_SELECTS = {
  user: {
    id: true,
    name: true,
    email: true,
    emailVerified: true,
    image: true,
    language: true,
    birthDate: true,
    role: true,
    banned: true,
    banReason: true,
    banExpires: true,
    twoFactorEnabled: true,
    communicationEmails: true,
    marketingEmails: true,
    socialEmails: true,
    securityEmails: true,
    notificationType: true,
    createdAt: true,
    updatedAt: true,
    lastLoginAt: true,
  },
  account: {
    id: true,
    providerId: true,
    accountId: true,
    scope: true,
    createdAt: true,
    updatedAt: true,
  },
  session: {
    id: true,
    ipAddress: true,
    userAgent: true,
    activeOrganizationId: true,
    impersonatedBy: true,
    createdAt: true,
    updatedAt: true,
    expiresAt: true,
  },
  twoFactor: {
    id: true,
    verified: true,
    lockedUntil: true,
  },
  passkey: {
    id: true,
    name: true,
    deviceType: true,
    backedUp: true,
    transports: true,
    aaguid: true,
    createdAt: true,
  },
  member: {
    id: true,
    role: true,
    createdAt: true,
    organization: organizationSelect,
  },
  invitation: invitationSelect,
  notification: {
    id: true,
    type: true,
    data: true,
    link: true,
    readAt: true,
    createdAt: true,
  },
  auditLog: {
    id: true,
    action: true,
    actorType: true,
    actorUserId: true,
    resourceType: true,
    resourceId: true,
    organizationId: true,
    metadata: true,
    createdAt: true,
  },
  oauthConsent: {
    id: true,
    clientId: true,
    scopes: true,
    createdAt: true,
    updatedAt: true,
    client: { select: { name: true } },
  },
} as const satisfies {
  user: Prisma.UserSelect;
  account: Prisma.AccountSelect;
  session: Prisma.SessionSelect;
  twoFactor: Prisma.TwoFactorSelect;
  passkey: Prisma.PasskeySelect;
  member: Prisma.MemberSelect;
  invitation: Prisma.InvitationSelect;
  notification: Prisma.NotificationSelect;
  auditLog: Prisma.AuditLogSelect;
  oauthConsent: Prisma.OauthConsentSelect;
};

type PrismaInvitation = Prisma.InvitationGetPayload<{
  select: typeof invitationSelect;
}>;

export class PrismaUserDataCollectorAdapter implements IUserDataCollectorPort {
  constructor(private readonly prisma: PrismaClient) {}

  async collect(userId: string): Promise<UserDataSnapshot | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_DATA_SELECTS.user,
    });

    if (!user) return null;

    const [
      accounts,
      sessions,
      twoFactors,
      passkeys,
      memberships,
      receivedInvitations,
      sentInvitations,
      notifications,
      auditLogs,
      consents,
    ] = await Promise.all([
      this.prisma.account.findMany({
        where: { userId },
        select: USER_DATA_SELECTS.account,
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.session.findMany({
        where: { userId },
        select: USER_DATA_SELECTS.session,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.twoFactor.findMany({
        where: { userId },
        select: USER_DATA_SELECTS.twoFactor,
      }),
      this.prisma.passkey.findMany({
        where: { userId },
        select: USER_DATA_SELECTS.passkey,
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.member.findMany({
        where: { userId },
        select: USER_DATA_SELECTS.member,
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.invitation.findMany({
        where: { email: { equals: user.email, mode: "insensitive" } },
        select: USER_DATA_SELECTS.invitation,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.invitation.findMany({
        where: { inviterId: userId },
        select: USER_DATA_SELECTS.invitation,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.findMany({
        where: { userId },
        select: USER_DATA_SELECTS.notification,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.auditLog.findMany({
        where: {
          OR: [
            { actorUserId: userId },
            { resourceType: "user", resourceId: userId },
          ],
        },
        select: USER_DATA_SELECTS.auditLog,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.oauthConsent.findMany({
        where: { userId },
        select: USER_DATA_SELECTS.oauthConsent,
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const avatarKey = getStorageObjectKey(user.image);

    return {
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        language: user.language,
        birthDate: toIso(user.birthDate),
        role: user.role,
        banned: Boolean(user.banned),
        banReason: user.banReason,
        banExpires: toIso(user.banExpires),
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
        emailPreferences: {
          communication: user.communicationEmails,
          marketing: user.marketingEmails,
          social: user.socialEmails,
          security: user.securityEmails,
        },
        notificationType: user.notificationType,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: toIso(user.lastLoginAt),
      },
      accounts: accounts.map((account) => ({
        id: account.id,
        providerId: account.providerId,
        accountId: account.accountId,
        scope: account.scope,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      })),
      sessions: sessions.map((session) => ({
        id: session.id,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        activeOrganizationId: session.activeOrganizationId,
        impersonated: Boolean(session.impersonatedBy),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      })),
      twoFactor: {
        enabled: Boolean(user.twoFactorEnabled),
        methods: twoFactors.map((twoFactor) => ({
          id: twoFactor.id,
          verified: twoFactor.verified ?? false,
          lockedUntil: toIso(twoFactor.lockedUntil),
        })),
      },
      passkeys: passkeys.map((passkey) => ({
        id: passkey.id,
        name: passkey.name,
        deviceType: passkey.deviceType,
        backedUp: passkey.backedUp,
        transports: passkey.transports,
        aaguid: passkey.aaguid,
        createdAt: toIso(passkey.createdAt),
      })),
      memberships: memberships.map((membership) => ({
        id: membership.id,
        role: membership.role,
        createdAt: membership.createdAt.toISOString(),
        organization: toOrganization(membership.organization),
      })),
      invitations: {
        received: receivedInvitations.map(toInvitation),
        sent: sentInvitations.map(toInvitation),
      },
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        data: notification.data as JsonValue,
        link: notification.link,
        readAt: toIso(notification.readAt),
        createdAt: notification.createdAt.toISOString(),
      })),
      auditLogs: auditLogs.map((auditLog) => ({
        id: auditLog.id,
        action: auditLog.action,
        actorType: auditLog.actorType,
        actorUserId: auditLog.actorUserId,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        organizationId: auditLog.organizationId,
        metadata: (auditLog.metadata ?? null) as JsonValue,
        createdAt: auditLog.createdAt.toISOString(),
      })),
      connectedApps: consents.map((consent) => ({
        id: consent.id,
        clientId: consent.clientId,
        clientName: consent.client.name,
        scopes: consent.scopes,
        createdAt: consent.createdAt.toISOString(),
        updatedAt: consent.updatedAt.toISOString(),
      })),
      storedFiles:
        avatarKey &&
        STORED_FILE_PREFIXES.some((prefix) => avatarKey.startsWith(prefix))
          ? [{ key: avatarKey, purpose: "avatar" }]
          : [],
    };
  }
}

function toIso(date: Date | null) {
  return date?.toISOString() ?? null;
}

function toOrganization(organization: {
  id: string;
  name: string;
  slug: string;
}) {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
  };
}

function toInvitation(invitation: PrismaInvitation) {
  return {
    id: invitation.id,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    expiresAt: invitation.expiresAt.toISOString(),
    createdAt: invitation.createdAt.toISOString(),
    organization: toOrganization(invitation.organization),
  };
}
