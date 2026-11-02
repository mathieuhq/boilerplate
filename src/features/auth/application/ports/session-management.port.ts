export type UserSessionRecord = {
  id: string;
  token: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  impersonatedBy: string | null;
};

export type ISessionManagementPort = {
  listSessions: (userId: string) => Promise<UserSessionRecord[]>;
  revokeSession: (token: string) => Promise<void>;
  revokeOtherSessions: () => Promise<void>;
};
