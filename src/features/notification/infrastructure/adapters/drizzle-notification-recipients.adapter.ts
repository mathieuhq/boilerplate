import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { ADMIN_ROLE, USER_ROLE } from "@/features/admin/domain/roles";
import type { Database } from "@/lib/db";
import { member, role, user } from "@/lib/schema";
import {
  type AccessFeature,
  type AccessLevel,
  fromAccessEntries,
  hasAccess,
} from "@/shared/domain/access-control";

import type { INotificationRecipientsPort } from "../../application/ports/notification-recipients.port";
import type { NotificationAudience } from "../../domain/notification.types";

export class DrizzleNotificationRecipientsAdapter implements INotificationRecipientsPort {
  constructor(private readonly db: Database) {}

  async resolve(audience: NotificationAudience): Promise<string[]> {
    if (audience.kind === "users") return this.resolveUsers(audience.userIds);

    if (audience.kind === "organization")
      return this.resolveOrganization(audience.organizationId, audience.roles);

    return this.resolveAccess(audience.feature, audience.level);
  }

  private async resolveUsers(userIds: string[]) {
    if (userIds.length === 0) return [];

    const users = await this.db
      .select({ id: user.id })
      .from(user)
      .where(and(inArray(user.id, userIds), isNull(user.deletedAt)));

    return users.map((row) => row.id);
  }

  private async resolveOrganization(organizationId: string, roles?: string[]) {
    const members = await this.db
      .select({ userId: member.userId, role: member.role })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(eq(member.organizationId, organizationId), isNull(user.deletedAt)),
      );

    return members
      .filter(
        (row) =>
          !roles ||
          row.role.split(",").some((value) => roles.includes(value.trim())),
      )
      .map((row) => row.userId);
  }

  private async resolveAccess(feature: AccessFeature, level: AccessLevel) {
    const roles = await this.db
      .select({ key: role.key, permissions: role.permissions })
      .from(role);
    const roleKeys = [
      ADMIN_ROLE,
      ...roles
        .filter((row) =>
          hasAccess(fromAccessEntries(row.permissions), feature, level),
        )
        .map((row) => row.key),
    ];

    const users = await this.db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          isNull(user.deletedAt),
          or(
            inArray(user.role, roleKeys),
            roleKeys.includes(USER_ROLE) ? isNull(user.role) : undefined,
          ),
        ),
      );

    return users.map((row) => row.id);
  }
}
