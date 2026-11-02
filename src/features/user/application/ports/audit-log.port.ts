type UserAuditLogEntry = {
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type IUserAuditLogPort = {
  record: (entry: UserAuditLogEntry) => Promise<void>;
};
