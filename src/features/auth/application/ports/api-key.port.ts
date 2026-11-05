export type ApiKeyRecord = {
  id: string;
  name: string | null;
  start: string | null;
  userId: string;
  createdAt: Date;
  lastRequestAt: Date | null;
  expiresAt: Date | null;
};

export type CreatedApiKey = {
  record: ApiKeyRecord;
  key: string;
};

export type ApiKeyOwner = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean;
  banExpires: Date | null;
};

export type ApiKeyVerification =
  | { status: "valid"; keyId: string; owner: ApiKeyOwner }
  | { status: "invalid" }
  | { status: "rate_limited" };

export type IApiKeyPort = {
  verifyApiKey: (key: string) => Promise<ApiKeyVerification>;
  listApiKeys: (userId: string) => Promise<ApiKeyRecord[]>;
  createApiKey: (userId: string, name: string) => Promise<CreatedApiKey>;
  deleteApiKey: (userId: string, keyId: string) => Promise<boolean>;
};
