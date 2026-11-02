type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };

export type UserDataSnapshot = {
  profile: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    language: string;
    birthDate: string | null;
    role: string | null;
    banned: boolean;
    banReason: string | null;
    banExpires: string | null;
    twoFactorEnabled: boolean;
    emailPreferences: {
      communication: boolean;
      marketing: boolean;
      social: boolean;
      security: boolean;
    };
    notificationType: string;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
  };
  accounts: {
    id: string;
    providerId: string;
    accountId: string;
    scope: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
  sessions: {
    id: string;
    ipAddress: string | null;
    userAgent: string | null;
    activeOrganizationId: string | null;
    impersonated: boolean;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  }[];
  twoFactor: {
    enabled: boolean;
    methods: {
      id: string;
      verified: boolean;
      lockedUntil: string | null;
    }[];
  };
  passkeys: {
    id: string;
    name: string | null;
    deviceType: string;
    backedUp: boolean;
    transports: string | null;
    aaguid: string | null;
    createdAt: string | null;
  }[];
  memberships: {
    id: string;
    role: string;
    createdAt: string;
    organization: { id: string; name: string; slug: string };
  }[];
  invitations: {
    received: DataExportInvitation[];
    sent: DataExportInvitation[];
  };
  notifications: {
    id: string;
    type: string;
    data: JsonValue;
    link: string | null;
    readAt: string | null;
    createdAt: string;
  }[];
  auditLogs: {
    id: string;
    action: string;
    actorType: string;
    actorUserId: string | null;
    resourceType: string;
    resourceId: string | null;
    organizationId: string | null;
    metadata: JsonValue;
    createdAt: string;
  }[];
  connectedApps: {
    id: string;
    clientId: string;
    clientName: string | null;
    scopes: string[];
    createdAt: string;
    updatedAt: string;
  }[];
  storedFiles: {
    key: string;
    purpose: "avatar";
  }[];
};

type DataExportInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  organization: { id: string; name: string; slug: string };
};
