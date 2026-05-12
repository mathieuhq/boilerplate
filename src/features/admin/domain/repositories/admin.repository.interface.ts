export type DailyRegistrationStat = {
  date: string;
  count: number;
};

export type AdminUserRole = "user" | "admin";

export type AdminOverviewMetrics = {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalOrganizations: number;
  pendingInvitations: number;
  bannedUsers: number;
  activeSessions: number;
};

export type AdminListResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
};

export type AdminListUsersInput = {
  page: number;
  limit: number;
  search?: string;
  role?: AdminUserRole;
  banned?: boolean;
  emailVerified?: boolean;
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

export type AdminListOrganizationsInput = {
  page: number;
  limit: number;
  search?: string;
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

export type AdminAuditLogMetadataValue =
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

export type AdminListAuditLogsInput = {
  page: number;
  limit: number;
  action?: string;
  actorUserId?: string;
  resourceType?: string;
  from?: Date;
  to?: Date;
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
  ) => Promise<AdminListResult<AdminUserListItem>>;
  getUserSecurityState: (
    userId: string,
  ) => Promise<AdminUserSecurityState | null>;
  countActiveAdmins: () => Promise<number>;
  setUserRole: (input: AdminSetUserRoleInput) => Promise<AdminUserListItem>;
  banUser: (input: AdminBanUserInput) => Promise<AdminUserListItem>;
  unbanUser: (input: AdminUnbanUserInput) => Promise<AdminUserListItem>;
  listOrganizations: (
    input: AdminListOrganizationsInput,
  ) => Promise<AdminListResult<AdminOrganizationListItem>>;
  getOrganizationDetails: (
    input: AdminGetOrganizationDetailsInput,
  ) => Promise<AdminOrganizationDetails | null>;
  listAuditLogs: (
    input: AdminListAuditLogsInput,
  ) => Promise<AdminListResult<AdminAuditLog>>;
  createAuditLog: (input: AdminCreateAuditLogInput) => Promise<AdminAuditLog>;
};
