import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";

import type {
  AdminAuditLog,
  AdminAuditLogMetadata,
  AdminBanUserInput,
  AdminCreateAuditLogInput,
  AdminGetOrganizationDetailsInput,
  AdminListAuditLogsInput,
  AdminListOrganizationsInput,
  AdminListResult,
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
import { normalizeRoleKey, USER_ROLE } from "../../domain/roles";
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
  ): Promise<AdminListResult<AdminUserListItem>> {
    const { page, limit } = normalizePagination(input);
    const where = buildUserWhere(input);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: adminUserSelect(),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginatedResult({
      page,
      limit,
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

  async countActiveAdmins(): Promise<number> {
    return this.prisma.user.count({
      where: {
        ...activeUserWhere(),
        role: "admin",
        OR: [{ banned: false }, { banned: null }],
      },
    });
  }

  async setUserRole(input: AdminSetUserRoleInput): Promise<AdminUserListItem> {
    const user = await this.prisma.user.update({
      where: { id: input.userId },
      data: { role: input.role },
      select: adminUserSelect(),
    });

    return this.toAdminUserListItem(user);
  }

  async banUser(input: AdminBanUserInput): Promise<AdminUserListItem> {
    const user = await this.prisma.user.update({
      where: { id: input.userId },
      data: {
        banned: true,
        banReason: input.reason ?? null,
        banExpires: input.expiresAt ?? null,
      },
      select: adminUserSelect(),
    });

    return this.toAdminUserListItem(user);
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
  ): Promise<AdminListResult<AdminOrganizationListItem>> {
    const { page, limit } = normalizePagination(input);
    const where = buildOrganizationWhere(input);

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        select: adminOrganizationSelect({ includeAllRows: false }),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return paginatedResult({
      page,
      limit,
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
  ): Promise<AdminListResult<AdminAuditLog>> {
    const { page, limit } = normalizePagination(input);
    const where = buildAuditLogWhere(input);

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        select: adminAuditLogSelect(),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginatedResult({
      page,
      limit,
      total,
      items: auditLogs.map(toAdminAuditLog),
    });
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

function activeUserWhere(): Prisma.UserWhereInput {
  return { deletedAt: null };
}

function normalizePagination(input: { page: number; limit: number }) {
  return {
    page: Math.max(1, input.page),
    limit: Math.min(100, Math.max(1, input.limit)),
  };
}

function paginatedResult<T>({
  page,
  limit,
  total,
  items,
}: {
  page: number;
  limit: number;
  total: number;
  items: T[];
}): AdminListResult<T> {
  return {
    page,
    limit,
    total,
    items,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}

function buildUserWhere(input: AdminListUsersInput): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = activeUserWhere();
  const search = input.search?.trim();

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (input.role) {
    where.AND = [
      input.role === USER_ROLE
        ? { OR: [{ role: null }, { role: "" }, { role: USER_ROLE }] }
        : { role: input.role },
    ];
  }

  if (input.emailVerified !== undefined) {
    where.emailVerified = input.emailVerified;
  }

  if (input.banned !== undefined) {
    where.banned = input.banned;
  }

  return where;
}

function buildOrganizationWhere(
  input: AdminListOrganizationsInput,
): Prisma.OrganizationWhereInput {
  const where: Prisma.OrganizationWhereInput = {};
  const search = input.search?.trim();

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildAuditLogWhere(
  input: AdminListAuditLogsInput,
): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (input.action?.trim()) {
    where.action = { contains: input.action.trim(), mode: "insensitive" };
  }

  if (input.actorUserId?.trim()) {
    where.actorUserId = input.actorUserId.trim();
  }

  if (input.resourceType?.trim()) {
    where.resourceType = {
      contains: input.resourceType.trim(),
      mode: "insensitive",
    };
  }

  if (input.from || input.to) {
    where.createdAt = {
      ...(input.from ? { gte: input.from } : {}),
      ...(input.to ? { lte: input.to } : {}),
    };
  }

  return where;
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
