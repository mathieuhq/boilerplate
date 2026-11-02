import { ADMIN_ROLE, USER_ROLE } from "@/features/admin/domain/roles";
import type { PrismaClient } from "@/lib/generated/prisma/client";
import {
  type AccessFeature,
  type AccessLevel,
  fromAccessEntries,
  hasAccess,
} from "@/shared/domain/access-control";

import type { INotificationRecipientsPort } from "../../application/ports/notification-recipients.port";
import type { NotificationAudience } from "../../domain/notification.types";

export class PrismaNotificationRecipientsAdapter implements INotificationRecipientsPort {
  constructor(private readonly prisma: PrismaClient) {}

  async resolve(audience: NotificationAudience): Promise<string[]> {
    if (audience.kind === "users") return this.resolveUsers(audience.userIds);

    if (audience.kind === "organization")
      return this.resolveOrganization(audience.organizationId, audience.roles);

    return this.resolveAccess(audience.feature, audience.level);
  }

  private async resolveUsers(userIds: string[]) {
    if (userIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds }, deletedAt: null },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }

  private async resolveOrganization(organizationId: string, roles?: string[]) {
    const members = await this.prisma.member.findMany({
      where: { organizationId, user: { deletedAt: null } },
      select: { userId: true, role: true },
    });

    return members
      .filter(
        (member) =>
          !roles ||
          member.role.split(",").some((role) => roles.includes(role.trim())),
      )
      .map((member) => member.userId);
  }

  private async resolveAccess(feature: AccessFeature, level: AccessLevel) {
    const roles = await this.prisma.role.findMany({
      select: { key: true, permissions: true },
    });
    const roleKeys = [
      ADMIN_ROLE,
      ...roles
        .filter((role) =>
          hasAccess(fromAccessEntries(role.permissions), feature, level),
        )
        .map((role) => role.key),
    ];

    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { role: { in: roleKeys } },
          ...(roleKeys.includes(USER_ROLE) ? [{ role: null }] : []),
        ],
      },
      select: { id: true },
    });

    return users.map((user) => user.id);
  }
}
