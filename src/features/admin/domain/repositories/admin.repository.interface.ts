import type { ListQuery, PaginatedResult } from "@/shared/domain/list-query";

import type {
  AdminAuditLogSortField,
  AdminOrganizationSortField,
  AdminUserSortField,
} from "../admin-list";

export type DailyRegistrationStat = {
  date: string;
  count: number;
};

export type AdminUserRole = string;

export type AdminOverviewMetrics = {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalOrganizations: number;
  pendingInvitations: number;
  bannedUsers: number;
  activeSessions: number;
};

export type AdminListUsersInput = ListQuery<AdminUserSortField> & {
  role?: AdminUserRole[];
  banned?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  banned: boolean;
  banReason: string | null;
  banExpires: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerified: boolean;
  activeSessionsCount: number;
};

export type AdminUserSecurityState = {
  id: string;
  role: AdminUserRole;
  banned: boolean;
};

export type AdminSetUserRoleInput = {
  userId: string;
  role: AdminUserRole;
};

export type AdminBanUserInput = {
  userId: string;
  reason?: string;
  expiresAt?: Date | null;
};

export type AdminUnbanUserInput = {
  userId: string;
};

export type AdminListOrganizationsInput =
  ListQuery<AdminOrganizationSortField> & {
    createdAt?: string;
  };

export type AdminOrganizationListItem = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  } | null;
  membersCount: number;
  pendingInvitationsCount: number;
};

export type AdminOrganizationDetails = AdminOrganizationListItem & {
  members: {
    id: string;
    role: string;
    createdAt: string;
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
    createdAt: string;
    expiresAt: string;
  }[];
};

export type AdminGetOrganizationDetailsInput = {
  organizationId: string;
};

type AdminAuditLogMetadataValue =
  | null
  | string
  | number
  | boolean
  | AdminAuditLogMetadataValue[]
  | { [key: string]: AdminAuditLogMetadataValue };

export type AdminAuditLogMetadata = Record<
  string,
  AdminAuditLogMetadataValue
> | null;

export type AdminListAuditLogsInput = ListQuery<AdminAuditLogSortField> & {
  action?: string[];
  actorType?: string[];
  resourceType?: string[];
  actor?: string;
  createdAt?: string;
};

export type AdminAuditLogFacets = {
  actions: string[];
  actorTypes: string[];
  resourceTypes: string[];
};

export type AdminAuditLog = {
  id: string;
  actorUserId: string | null;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  organizationId: string | null;
  metadata: AdminAuditLogMetadata;
  createdAt: string;
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

export type AdminCreateAuditLogInput = {
  actorUserId?: string | null;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  organizationId?: string | null;
  metadata?: AdminAuditLogMetadata;
};

export type IAdminRepository = {
  getOverviewMetrics: () => Promise<AdminOverviewMetrics>;
  getRegistrationsByDay: (days: number) => Promise<DailyRegistrationStat[]>;
  listUsers: (
    input: AdminListUsersInput,
  ) => Promise<PaginatedResult<AdminUserListItem>>;
  getUserSecurityState: (
    userId: string,
  ) => Promise<AdminUserSecurityState | null>;
  countActiveAdmins: () => Promise<number>;
  setUserRole: (input: AdminSetUserRoleInput) => Promise<AdminUserListItem>;
  banUser: (input: AdminBanUserInput) => Promise<AdminUserListItem>;
  unbanUser: (input: AdminUnbanUserInput) => Promise<AdminUserListItem>;
  listOrganizations: (
    input: AdminListOrganizationsInput,
  ) => Promise<PaginatedResult<AdminOrganizationListItem>>;
  getOrganizationDetails: (
    input: AdminGetOrganizationDetailsInput,
  ) => Promise<AdminOrganizationDetails | null>;
  listAuditLogs: (
    input: AdminListAuditLogsInput,
  ) => Promise<PaginatedResult<AdminAuditLog>>;
  getAuditLogFacets: () => Promise<AdminAuditLogFacets>;
  createAuditLog: (input: AdminCreateAuditLogInput) => Promise<AdminAuditLog>;
};
