import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import {
  EXPORT_BATCH_SIZE,
  type PaginatedResult,
  toPaginatedResult,
} from "@/shared/domain/list-query";
import {
  containsInsensitive,
  type PrismaListConfig,
  toPrismaDateRange,
  toPrismaListArgs,
} from "@/shared/infrastructure/prisma/prisma-list-query";

import type {
  AdminAuditLog,
  AdminAuditLogFacets,
  AdminAuditLogMetadata,
  AdminBanUserInput,
  AdminCreateAuditLogInput,
  AdminGetOrganizationDetailsInput,
  AdminListAuditLogsInput,
  AdminListOrganizationsInput,
  AdminListUsersInput,
  AdminOrganizationDetails,
  AdminOrganizationListItem,
  AdminOverviewMetrics,
  AdminSetUserRoleInput,
  AdminUnbanUserInput,
  AdminUserListItem,
  AdminUserRole,
  AdminUserSecurityState,
  DailyRegistrationStat,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";
import { ADMIN_ROLE, normalizeRoleKey, USER_ROLE } from "../../domain/roles";
import type { ActiveSessionCounter } from "../adapters/active-session-counter";

type PrismaAdminUser = {
  id: string;
  name: string;
  role: string | null;
  email: string;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  emailVerified: boolean;
};

type PrismaAdminOrganization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  members: {
    id: string;
    role: string;
    createdAt: Date;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }[];
  invitations: {
    id: string;
    email: string;
    role: string;
    status: string;
    createdAt: Date;
    expiresAt: Date;
  }[];
  _count: {
    members: number;
    invitations: number;
  };
};

type PrismaAdminAuditLog = {
  id: string;
  actorUserId: string | null;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  organizationId: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  actorUser: {
    id: string;
    name: string;
    email: string;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export class PrismaAdminRepository implements IAdminRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly activeSessionCounter: ActiveSessionCounter,
  ) {}

  async getOverviewMetrics(): Promise<AdminOverviewMetrics> {
    const now = new Date();
    const sevenDaysAgo = subtractDays(now, 7);
    const thirtyDaysAgo = subtractDays(now, 30);

    const [
      totalUsers,
      newUsersLast7Days,
      newUsersLast30Days,
      totalOrganizations,
      pendingInvitations,
      bannedUsers,
      activeSessions,
    ] = await Promise.all([
      this.prisma.user.count({ where: activeUserWhere() }),
      this.prisma.user.count({
        where: {
          ...activeUserWhere(),
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      this.prisma.user.count({
        where: {
          ...activeUserWhere(),
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.organization.count(),
      this.prisma.invitation.count({ where: { status: "pending" } }),
      this.prisma.user.count({
        where: {
          ...activeUserWhere(),
          banned: true,
        },
      }),
      this.activeSessionCounter.countAll(),
    ]);

    return {
      totalUsers,
      newUsersLast7Days,
      newUsersLast30Days,
      totalOrganizations,
      pendingInvitations,
      bannedUsers,
      activeSessions,
    };
  }

  async getRegistrationsByDay(days: number): Promise<DailyRegistrationStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const countsByDate = new Map<string, number>();

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      countsByDate.set(dateKey, 0);
    }

    for (const user of users) {
      const dateKey = user.createdAt.toISOString().split("T")[0];
      const currentCount = countsByDate.get(dateKey) ?? 0;
      countsByDate.set(dateKey, currentCount + 1);
    }

    return Array.from(countsByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  async listUsers(
    input: AdminListUsersInput,
  ): Promise<PaginatedResult<AdminUserListItem>> {
    const { where, orderBy, skip, take, page, pageSize } = toPrismaListArgs(
      input,
      USER_LIST_CONFIG,
    );

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
        select: adminUserSelect(),
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPaginatedResult({
      page,
      pageSize,
      total,
      items: await this.toAdminUserListItems(users),
    });
  }

  async getUserSecurityState(
    userId: string,
  ): Promise<AdminUserSecurityState | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        banned: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      role: toAdminRole(user.role),
      banned: Boolean(user.banned),
    };
  }

  async setUserRole(
    input: AdminSetUserRoleInput,
  ): Promise<AdminUserListItem | null> {
    const user = await this.prisma.$transaction(async (tx) => {
      if (
        input.role !== ADMIN_ROLE &&
        !(await keepsActiveAdmin(tx, input.userId))
      )
        return null;

      return tx.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: adminUserSelect(),
      });
    });

    return user && this.toAdminUserListItem(user);
  }

  async banUser(input: AdminBanUserInput): Promise<AdminUserListItem | null> {
    const user = await this.prisma.$transaction(async (tx) => {
      if (!(await keepsActiveAdmin(tx, input.userId))) return null;

      const banned = await tx.user.update({
        where: { id: input.userId },
        data: {
          banned: true,
          banReason: input.reason ?? null,
          banExpires: input.expiresAt ?? null,
        },
        select: adminUserSelect(),
      });
      const revoked = new Date();

      await tx.oauthRefreshToken.updateMany({
        where: { userId: input.userId, revoked: null },
        data: { revoked },
      });
      await tx.oauthAccessToken.updateMany({
        where: { userId: input.userId, revoked: null },
        data: { revoked },
      });

      return banned;
    });

    return user && this.toAdminUserListItem(user);
  }

  async unbanUser(input: AdminUnbanUserInput): Promise<AdminUserListItem> {
    const user = await this.prisma.user.update({
      where: { id: input.userId },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
      select: adminUserSelect(),
    });

    return this.toAdminUserListItem(user);
  }

  async listOrganizations(
    input: AdminListOrganizationsInput,
  ): Promise<PaginatedResult<AdminOrganizationListItem>> {
    const { where, orderBy, skip, take, page, pageSize } = toPrismaListArgs(
      input,
      ORGANIZATION_LIST_CONFIG,
    );

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        orderBy,
        skip,
        take,
        select: adminOrganizationSelect({ includeAllRows: false }),
      }),
      this.prisma.organization.count({ where }),
    ]);

    return toPaginatedResult({
      page,
      pageSize,
      total,
      items: organizations.map(toAdminOrganizationListItem),
    });
  }

  async getOrganizationDetails(
    input: AdminGetOrganizationDetailsInput,
  ): Promise<AdminOrganizationDetails | null> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: adminOrganizationSelect({ includeAllRows: true }),
    });

    if (!organization) return null;

    return toAdminOrganizationDetails(organization);
  }

  async listAuditLogs(
    input: AdminListAuditLogsInput,
  ): Promise<PaginatedResult<AdminAuditLog>> {
    const { where, orderBy, skip, take, page, pageSize } = toPrismaListArgs(
      input,
      AUDIT_LOG_LIST_CONFIG,
    );

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip,
        take,
        select: adminAuditLogSelect(),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return toPaginatedResult({
      page,
      pageSize,
      total,
      items: auditLogs.map(toAdminAuditLog),
    });
  }

  async getAuditLogFacets(): Promise<AdminAuditLogFacets> {
    const [actions, actorTypes, resourceTypes] = await Promise.all([
      this.prisma.auditLog.findMany({
        distinct: ["action"],
        select: { action: true },
        orderBy: { action: "asc" },
        take: AUDIT_LOG_FACET_LIMIT,
      }),
      this.prisma.auditLog.findMany({
        distinct: ["actorType"],
        select: { actorType: true },
        orderBy: { actorType: "asc" },
        take: AUDIT_LOG_FACET_LIMIT,
      }),
      this.prisma.auditLog.findMany({
        distinct: ["resourceType"],
        select: { resourceType: true },
        orderBy: { resourceType: "asc" },
        take: AUDIT_LOG_FACET_LIMIT,
      }),
    ]);

    return {
      actions: actions.map((row) => row.action),
      actorTypes: actorTypes.map((row) => row.actorType),
      resourceTypes: resourceTypes.map((row) => row.resourceType),
    };
  }

  async createAuditLog(
    input: AdminCreateAuditLogInput,
  ): Promise<AdminAuditLog> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        action: input.action,
        actorType: input.actorType,
        resourceType: input.resourceType,
        actorUserId: input.actorUserId ?? null,
        resourceId: input.resourceId ?? null,
        organizationId: input.organizationId ?? null,
        metadata: toPrismaJson(input.metadata),
      },
      select: adminAuditLogSelect(),
    });

    return toAdminAuditLog(auditLog);
  }

  private async toAdminUserListItems(
    users: PrismaAdminUser[],
  ): Promise<AdminUserListItem[]> {
    const counts = await this.activeSessionCounter.countByUser(
      users.map((user) => user.id),
    );

    return users.map((user) =>
      toAdminUserListItem(user, counts.get(user.id) ?? 0),
    );
  }

  private async toAdminUserListItem(
    user: PrismaAdminUser,
  ): Promise<AdminUserListItem> {
    const [item] = await this.toAdminUserListItems([user]);

    return item;
  }
}

async function keepsActiveAdmin(tx: Prisma.TransactionClient, userId: string) {
  const admins = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "user"
    WHERE role = ${ADMIN_ROLE} AND deleted_at IS NULL AND banned IS NOT TRUE
    FOR UPDATE
  `;

  return admins.length > 1 || admins.every((admin) => admin.id !== userId);
}

function activeUserWhere(): Prisma.UserWhereInput {
  return { deletedAt: null };
}

const AUDIT_LOG_FACET_LIMIT = 200;

const USER_LIST_CONFIG: PrismaListConfig<
  AdminListUsersInput,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput
> = {
  where: activeUserWhere(),
  maxPageSize: EXPORT_BATCH_SIZE,
  tieBreaker: { id: "desc" },
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    name: "name",
    email: "email",
    role: "role",
    createdAt: "createdAt",
    lastLoginAt: (direction) => ({
      lastLoginAt: { sort: direction, nulls: "last" },
    }),
  },
  search: (term) => ({
    OR: [
      { name: containsInsensitive(term) },
      { email: containsInsensitive(term) },
    ],
  }),
  filters: {
    role: (roles) => ({
      OR: roles.map((role) =>
        role === USER_ROLE
          ? { OR: [{ role: null }, { role: "" }, { role: USER_ROLE }] }
          : { role },
      ),
    }),
    banned: (banned) =>
      banned ? { banned: true } : { OR: [{ banned: false }, { banned: null }] },
    emailVerified: (emailVerified) => ({ emailVerified }),
    createdAt: (value) => toCreatedAtWhere(value),
  },
};

const ORGANIZATION_LIST_CONFIG: PrismaListConfig<
  AdminListOrganizationsInput,
  Prisma.OrganizationWhereInput,
  Prisma.OrganizationOrderByWithRelationInput
> = {
  maxPageSize: EXPORT_BATCH_SIZE,
  tieBreaker: { id: "desc" },
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    name: "name",
    slug: "slug",
    createdAt: "createdAt",
    members: (direction) => ({ members: { _count: direction } }),
  },
  search: (term) => ({
    OR: [
      { name: containsInsensitive(term) },
      { slug: containsInsensitive(term) },
    ],
  }),
  filters: {
    createdAt: (value) => toCreatedAtWhere(value),
  },
};

const AUDIT_LOG_LIST_CONFIG: PrismaListConfig<
  AdminListAuditLogsInput,
  Prisma.AuditLogWhereInput,
  Prisma.AuditLogOrderByWithRelationInput
> = {
  maxPageSize: EXPORT_BATCH_SIZE,
  tieBreaker: { id: "desc" },
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    action: "action",
    actorType: "actorType",
    resourceType: "resourceType",
    createdAt: "createdAt",
  },
  search: (term) => ({
    OR: [
      { action: containsInsensitive(term) },
      { resourceType: containsInsensitive(term) },
      { resourceId: term },
      { organization: { is: { name: containsInsensitive(term) } } },
    ],
  }),
  filters: {
    action: (actions) => ({ action: { in: actions } }),
    actorType: (actorTypes) => ({ actorType: { in: actorTypes } }),
    resourceType: (resourceTypes) => ({ resourceType: { in: resourceTypes } }),
    actor: (actor) => ({
      OR: [
        { actorUserId: actor },
        {
          actorUser: {
            is: {
              OR: [
                { name: containsInsensitive(actor) },
                { email: containsInsensitive(actor) },
              ],
            },
          },
        },
      ],
    }),
    createdAt: (value) => toCreatedAtWhere(value),
  },
};

function toCreatedAtWhere(value: string) {
  const createdAt = toPrismaDateRange(value);

  return createdAt ? { createdAt } : undefined;
}

function adminUserSelect() {
  return {
    id: true,
    name: true,
    role: true,
    email: true,
    banned: true,
    banReason: true,
    banExpires: true,
    createdAt: true,
    lastLoginAt: true,
    emailVerified: true,
  } satisfies Prisma.UserSelect;
}

function adminOrganizationSelect({
  includeAllRows,
}: {
  includeAllRows: boolean;
}) {
  return {
    id: true,
    name: true,
    slug: true,
    createdAt: true,
    members: {
      where: includeAllRows ? undefined : { role: "owner" },
      orderBy: [{ role: "desc" }, { createdAt: "asc" }, { id: "asc" }],
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
    invitations: {
      where: includeAllRows ? undefined : { status: "pending" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        role: true,
        email: true,
        status: true,
        createdAt: true,
        expiresAt: true,
      },
    },
    _count: {
      select: {
        members: true,
        invitations: {
          where: { status: "pending" },
        },
      },
    },
  } satisfies Prisma.OrganizationSelect;
}

function adminAuditLogSelect() {
  return {
    id: true,
    action: true,
    metadata: true,
    actorType: true,
    resourceId: true,
    createdAt: true,
    actorUserId: true,
    resourceType: true,
    organizationId: true,
    actorUser: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    organization: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  } satisfies Prisma.AuditLogSelect;
}

function toAdminRole(role: string | null): AdminUserRole {
  return normalizeRoleKey(role);
}

function toAdminUserListItem(
  user: PrismaAdminUser,
  activeSessionsCount: number,
): AdminUserListItem {
  return {
    id: user.id,
    name: user.name,
    role: toAdminRole(user.role),
    email: user.email,
    banned: Boolean(user.banned),
    banReason: user.banReason,
    emailVerified: user.emailVerified,
    activeSessionsCount,
    createdAt: user.createdAt.toISOString(),
    banExpires: user.banExpires?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

function toAdminOrganizationListItem(
  organization: PrismaAdminOrganization,
): AdminOrganizationListItem {
  const owner = organization.members.find((member) => member.role === "owner");

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    createdAt: organization.createdAt.toISOString(),
    membersCount: organization._count.members,
    pendingInvitationsCount: organization._count.invitations,
    owner: owner
      ? {
          id: owner.user.id,
          name: owner.user.name,
          email: owner.user.email,
        }
      : null,
  };
}

function toAdminOrganizationDetails(
  organization: PrismaAdminOrganization,
): AdminOrganizationDetails {
  return {
    ...toAdminOrganizationListItem(organization),
    members: organization.members.map((member) => ({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      },
    })),
    invitations: organization.invitations.map((invitation) => ({
      id: invitation.id,
      role: invitation.role,
      email: invitation.email,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
    })),
  };
}

function toAdminAuditLog(auditLog: PrismaAdminAuditLog): AdminAuditLog {
  return {
    id: auditLog.id,
    action: auditLog.action,
    actorType: auditLog.actorType,
    resourceId: auditLog.resourceId,
    createdAt: auditLog.createdAt.toISOString(),
    actorUserId: auditLog.actorUserId,
    resourceType: auditLog.resourceType,
    organizationId: auditLog.organizationId,
    actorUser: auditLog.actorUser,
    organization: auditLog.organization,
    metadata: toAuditLogMetadata(auditLog.metadata),
  };
}

function toAuditLogMetadata(
  metadata: Prisma.JsonValue | null,
): AdminAuditLogMetadata {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object")
    return null;

  return metadata as AdminAuditLogMetadata;
}

function toPrismaJson(
  metadata?: AdminAuditLogMetadata,
): Prisma.InputJsonValue | undefined {
  if (!metadata) return undefined;

  return metadata as Prisma.InputJsonObject;
}

function subtractDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}
