import {
  type AnyColumn,
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import type { Database, Transaction } from "@/lib/db";
import {
  auditLog,
  invitation,
  member,
  oauthAccessToken,
  oauthRefreshToken,
  organization,
  user,
} from "@/lib/schema";
import {
  EXPORT_BATCH_SIZE,
  type PaginatedResult,
  toPaginatedResult,
} from "@/shared/domain/list-query";
import {
  containsInsensitive,
  type DrizzleListConfig,
  sortNullsLast,
  toDateRangeWhere,
  toDrizzleListArgs,
} from "@/shared/infrastructure/drizzle/drizzle-list-query";

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

type DrizzleAdminUser = {
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

type DrizzleAdminOrganization = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  membersCount: number;
  pendingInvitationsCount: number;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type DrizzleAdminAuditLog = {
  id: string;
  actorUserId: string | null;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  organizationId: string | null;
  metadata: unknown;
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

export class DrizzleAdminRepository implements IAdminRepository {
  constructor(
    private readonly db: Database,
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
      this.db.$count(user, activeUserWhere()),
      this.db.$count(
        user,
        and(activeUserWhere(), gte(user.createdAt, sevenDaysAgo)),
      ),
      this.db.$count(
        user,
        and(activeUserWhere(), gte(user.createdAt, thirtyDaysAgo)),
      ),
      this.db.$count(organization),
      this.db.$count(invitation, eq(invitation.status, "pending")),
      this.db.$count(user, and(activeUserWhere(), eq(user.banned, true))),
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

    const users = await this.db
      .select({ createdAt: user.createdAt })
      .from(user)
      .where(gte(user.createdAt, startDate))
      .orderBy(asc(user.createdAt));

    const countsByDate = new Map<string, number>();

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      countsByDate.set(dateKey, 0);
    }

    for (const row of users) {
      const dateKey = row.createdAt.toISOString().split("T")[0];
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
    const { where, orderBy, offset, limit, page, pageSize } = toDrizzleListArgs(
      input,
      USER_LIST_CONFIG,
    );

    const [users, total] = await Promise.all([
      this.db
        .select(ADMIN_USER_COLUMNS)
        .from(user)
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      this.db.$count(user, where),
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
    const found = await this.db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        role: true,
        banned: true,
      },
    });

    if (!found) return null;

    return {
      id: found.id,
      role: toAdminRole(found.role),
      banned: Boolean(found.banned),
    };
  }

  async setUserRole(
    input: AdminSetUserRoleInput,
  ): Promise<AdminUserListItem | null> {
    const updated = await this.db.transaction(async (tx) => {
      if (
        input.role !== ADMIN_ROLE &&
        !(await keepsActiveAdmin(tx, input.userId))
      )
        return null;

      return requireRow(
        await tx
          .update(user)
          .set({ role: input.role })
          .where(eq(user.id, input.userId))
          .returning(ADMIN_USER_COLUMNS),
      );
    });

    return updated && this.toAdminUserListItem(updated);
  }

  async banUser(input: AdminBanUserInput): Promise<AdminUserListItem | null> {
    const updated = await this.db.transaction(async (tx) => {
      if (!(await keepsActiveAdmin(tx, input.userId))) return null;

      const banned = requireRow(
        await tx
          .update(user)
          .set({
            banned: true,
            banReason: input.reason ?? null,
            banExpires: input.expiresAt ?? null,
          })
          .where(eq(user.id, input.userId))
          .returning(ADMIN_USER_COLUMNS),
      );
      const revoked = new Date();

      await tx
        .update(oauthRefreshToken)
        .set({ revoked })
        .where(
          and(
            eq(oauthRefreshToken.userId, input.userId),
            isNull(oauthRefreshToken.revoked),
          ),
        );
      await tx
        .update(oauthAccessToken)
        .set({ revoked })
        .where(
          and(
            eq(oauthAccessToken.userId, input.userId),
            isNull(oauthAccessToken.revoked),
          ),
        );

      return banned;
    });

    return updated && this.toAdminUserListItem(updated);
  }

  async unbanUser(input: AdminUnbanUserInput): Promise<AdminUserListItem> {
    const updated = requireRow(
      await this.db
        .update(user)
        .set({
          banned: false,
          banReason: null,
          banExpires: null,
        })
        .where(eq(user.id, input.userId))
        .returning(ADMIN_USER_COLUMNS),
    );

    return this.toAdminUserListItem(updated);
  }

  async listOrganizations(
    input: AdminListOrganizationsInput,
  ): Promise<PaginatedResult<AdminOrganizationListItem>> {
    const { where, orderBy, offset, limit, page, pageSize } = toDrizzleListArgs(
      input,
      ORGANIZATION_LIST_CONFIG,
    );

    const [organizations, total] = await Promise.all([
      this.db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          createdAt: organization.createdAt,
          membersCount: MEMBERS_COUNT,
          pendingInvitationsCount: PENDING_INVITATIONS_COUNT,
        })
        .from(organization)
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      this.db.$count(organization, where),
    ]);
    const owners = await this.findOwners(organizations.map(({ id }) => id));

    return toPaginatedResult({
      page,
      pageSize,
      total,
      items: organizations.map((row) =>
        toAdminOrganizationListItem({
          ...row,
          owner: owners.get(row.id) ?? null,
        }),
      ),
    });
  }

  async getOrganizationDetails(
    input: AdminGetOrganizationDetailsInput,
  ): Promise<AdminOrganizationDetails | null> {
    const found = await this.db.query.organization.findFirst({
      where: eq(organization.id, input.organizationId),
      columns: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
      with: {
        members: {
          orderBy: [desc(member.role), asc(member.createdAt), asc(member.id)],
          columns: {
            id: true,
            role: true,
            createdAt: true,
          },
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        invitations: {
          orderBy: [desc(invitation.createdAt), desc(invitation.id)],
          columns: {
            id: true,
            role: true,
            email: true,
            status: true,
            createdAt: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!found) return null;

    return {
      ...toAdminOrganizationListItem({
        ...found,
        membersCount: found.members.length,
        pendingInvitationsCount: found.invitations.filter(
          (row) => row.status === "pending",
        ).length,
        owner: found.members.find((row) => row.role === "owner")?.user ?? null,
      }),
      members: found.members.map((row) => ({
        id: row.id,
        role: row.role,
        createdAt: row.createdAt.toISOString(),
        user: {
          id: row.user.id,
          name: row.user.name,
          email: row.user.email,
        },
      })),
      invitations: found.invitations.map((row) => ({
        id: row.id,
        role: row.role,
        email: row.email,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      })),
    };
  }

  async listAuditLogs(
    input: AdminListAuditLogsInput,
  ): Promise<PaginatedResult<AdminAuditLog>> {
    const { where, orderBy, offset, limit, page, pageSize } = toDrizzleListArgs(
      input,
      AUDIT_LOG_LIST_CONFIG,
    );

    const [auditLogs, total] = await Promise.all([
      this.selectAuditLogs()
        .where(where)
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset),
      this.db.$count(auditLog, where),
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
      this.db
        .selectDistinct({ action: auditLog.action })
        .from(auditLog)
        .orderBy(asc(auditLog.action))
        .limit(AUDIT_LOG_FACET_LIMIT),
      this.db
        .selectDistinct({ actorType: auditLog.actorType })
        .from(auditLog)
        .orderBy(asc(auditLog.actorType))
        .limit(AUDIT_LOG_FACET_LIMIT),
      this.db
        .selectDistinct({ resourceType: auditLog.resourceType })
        .from(auditLog)
        .orderBy(asc(auditLog.resourceType))
        .limit(AUDIT_LOG_FACET_LIMIT),
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
    const [{ id }] = await this.db
      .insert(auditLog)
      .values({
        action: input.action,
        actorType: input.actorType,
        resourceType: input.resourceType,
        actorUserId: input.actorUserId ?? null,
        resourceId: input.resourceId ?? null,
        organizationId: input.organizationId ?? null,
        metadata: input.metadata ?? undefined,
      })
      .returning({ id: auditLog.id });
    const [created] = await this.selectAuditLogs().where(eq(auditLog.id, id));

    return toAdminAuditLog(created);
  }

  private selectAuditLogs() {
    return this.db
      .select({
        id: auditLog.id,
        action: auditLog.action,
        metadata: auditLog.metadata,
        actorType: auditLog.actorType,
        resourceId: auditLog.resourceId,
        createdAt: auditLog.createdAt,
        actorUserId: auditLog.actorUserId,
        resourceType: auditLog.resourceType,
        organizationId: auditLog.organizationId,
        actorUser: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      })
      .from(auditLog)
      .leftJoin(user, eq(auditLog.actorUserId, user.id))
      .leftJoin(organization, eq(auditLog.organizationId, organization.id));
  }

  private async findOwners(organizationIds: string[]) {
    const owners = new Map<string, DrizzleAdminOrganization["owner"]>();

    if (organizationIds.length === 0) return owners;

    const rows = await this.db.query.member.findMany({
      where: and(
        inArray(member.organizationId, organizationIds),
        eq(member.role, "owner"),
      ),
      orderBy: [asc(member.createdAt), asc(member.id)],
      columns: { organizationId: true },
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    for (const row of rows)
      if (!owners.has(row.organizationId))
        owners.set(row.organizationId, row.user);

    return owners;
  }

  private async toAdminUserListItems(
    users: DrizzleAdminUser[],
  ): Promise<AdminUserListItem[]> {
    const counts = await this.activeSessionCounter.countByUser(
      users.map((row) => row.id),
    );

    return users.map((row) =>
      toAdminUserListItem(row, counts.get(row.id) ?? 0),
    );
  }

  private async toAdminUserListItem(
    row: DrizzleAdminUser,
  ): Promise<AdminUserListItem> {
    const [item] = await this.toAdminUserListItems([row]);

    return item;
  }
}

async function keepsActiveAdmin(tx: Transaction, userId: string) {
  const admins = await tx
    .select({ id: user.id })
    .from(user)
    .where(
      and(
        eq(user.role, ADMIN_ROLE),
        isNull(user.deletedAt),
        sql`${user.banned} IS NOT TRUE`,
      ),
    )
    .for("update");

  return admins.length > 1 || admins.every((admin) => admin.id !== userId);
}

function requireRow<T>(rows: T[]): T {
  const [row] = rows;

  if (!row) throw new Error("Record to update not found");

  return row;
}

function activeUserWhere() {
  return isNull(user.deletedAt);
}

function inSubquery(column: AnyColumn, id: AnyColumn, where: SQL | undefined) {
  return sql`${column} IN (SELECT ${id} FROM ${id.table} WHERE ${where})`;
}

const AUDIT_LOG_FACET_LIMIT = 200;

const ADMIN_USER_COLUMNS = {
  id: user.id,
  name: user.name,
  role: user.role,
  email: user.email,
  banned: user.banned,
  banReason: user.banReason,
  banExpires: user.banExpires,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
  emailVerified: user.emailVerified,
};

const MEMBERS_COUNT =
  sql<number>`(SELECT count(*) FROM ${member} WHERE ${eq(member.organizationId, organization.id)})`.mapWith(
    Number,
  );

const PENDING_INVITATIONS_COUNT =
  sql<number>`(SELECT count(*) FROM ${invitation} WHERE ${and(eq(invitation.organizationId, organization.id), eq(invitation.status, "pending"))})`.mapWith(
    Number,
  );

const USER_LIST_CONFIG: DrizzleListConfig<AdminListUsersInput> = {
  id: user.id,
  where: activeUserWhere(),
  maxPageSize: EXPORT_BATCH_SIZE,
  tieBreaker: desc(user.id),
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: sortNullsLast(user.lastLoginAt),
  },
  search: (term) =>
    or(
      containsInsensitive(user.name, term),
      containsInsensitive(user.email, term),
    ),
  filters: {
    role: (roles) =>
      or(
        ...roles.map((role) =>
          role === USER_ROLE
            ? or(isNull(user.role), eq(user.role, ""), eq(user.role, USER_ROLE))
            : eq(user.role, role),
        ),
      ),
    banned: (banned) =>
      banned
        ? eq(user.banned, true)
        : or(eq(user.banned, false), isNull(user.banned)),
    emailVerified: (emailVerified) => eq(user.emailVerified, emailVerified),
    createdAt: (value) => toDateRangeWhere(user.createdAt, value),
  },
};

const ORGANIZATION_LIST_CONFIG: DrizzleListConfig<AdminListOrganizationsInput> =
  {
    id: organization.id,
    maxPageSize: EXPORT_BATCH_SIZE,
    tieBreaker: desc(organization.id),
    defaultSort: { field: "createdAt", direction: "desc" },
    sortable: {
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      members: (direction) =>
        direction === "asc" ? asc(MEMBERS_COUNT) : desc(MEMBERS_COUNT),
    },
    search: (term) =>
      or(
        containsInsensitive(organization.name, term),
        containsInsensitive(organization.slug, term),
      ),
    filters: {
      createdAt: (value) => toDateRangeWhere(organization.createdAt, value),
    },
  };

const AUDIT_LOG_LIST_CONFIG: DrizzleListConfig<AdminListAuditLogsInput> = {
  id: auditLog.id,
  maxPageSize: EXPORT_BATCH_SIZE,
  tieBreaker: desc(auditLog.id),
  defaultSort: { field: "createdAt", direction: "desc" },
  sortable: {
    action: auditLog.action,
    actorType: auditLog.actorType,
    resourceType: auditLog.resourceType,
    createdAt: auditLog.createdAt,
  },
  search: (term) =>
    or(
      containsInsensitive(auditLog.action, term),
      containsInsensitive(auditLog.resourceType, term),
      eq(auditLog.resourceId, term),
      inSubquery(
        auditLog.organizationId,
        organization.id,
        containsInsensitive(organization.name, term),
      ),
    ),
  filters: {
    action: (actions) => inArray(auditLog.action, actions),
    actorType: (actorTypes) => inArray(auditLog.actorType, actorTypes),
    resourceType: (resourceTypes) =>
      inArray(auditLog.resourceType, resourceTypes),
    actor: (actor) =>
      or(
        eq(auditLog.actorUserId, actor),
        inSubquery(
          auditLog.actorUserId,
          user.id,
          or(
            containsInsensitive(user.name, actor),
            containsInsensitive(user.email, actor),
          ),
        ),
      ),
    createdAt: (value) => toDateRangeWhere(auditLog.createdAt, value),
  },
};

function toAdminRole(role: string | null): AdminUserRole {
  return normalizeRoleKey(role);
}

function toAdminUserListItem(
  row: DrizzleAdminUser,
  activeSessionsCount: number,
): AdminUserListItem {
  return {
    id: row.id,
    name: row.name,
    role: toAdminRole(row.role),
    email: row.email,
    banned: Boolean(row.banned),
    banReason: row.banReason,
    emailVerified: row.emailVerified,
    activeSessionsCount,
    createdAt: row.createdAt.toISOString(),
    banExpires: row.banExpires?.toISOString() ?? null,
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
  };
}

function toAdminOrganizationListItem(
  row: DrizzleAdminOrganization,
): AdminOrganizationListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.createdAt.toISOString(),
    membersCount: row.membersCount,
    pendingInvitationsCount: row.pendingInvitationsCount,
    owner: row.owner
      ? {
          id: row.owner.id,
          name: row.owner.name,
          email: row.owner.email,
        }
      : null,
  };
}

function toAdminAuditLog(row: DrizzleAdminAuditLog): AdminAuditLog {
  return {
    id: row.id,
    action: row.action,
    actorType: row.actorType,
    resourceId: row.resourceId,
    createdAt: row.createdAt.toISOString(),
    actorUserId: row.actorUserId,
    resourceType: row.resourceType,
    organizationId: row.organizationId,
    actorUser: row.actorUser,
    organization: row.organization,
    metadata: toAuditLogMetadata(row.metadata),
  };
}

function toAuditLogMetadata(metadata: unknown): AdminAuditLogMetadata {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== "object")
    return null;

  return metadata as AdminAuditLogMetadata;
}

function subtractDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}
