type AuditLogMetadataValue =
  | null
  | string
  | number
  | boolean
  | AuditLogMetadataValue[]
  | { [key: string]: AuditLogMetadataValue };

export type AuditLogMetadata = Record<string, AuditLogMetadataValue>;

export type AuditLogEntry = {
  actorUserId: string | null;
  actorType: "user" | "system";
  action: string;
  resourceType: string;
  resourceId?: string | null;
  organizationId?: string | null;
  metadata?: AuditLogMetadata;
};

export type IAuditLogPort = {
  record: (entry: AuditLogEntry) => Promise<void>;
};
