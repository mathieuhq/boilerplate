import type { ApiKeyRecord } from "../ports/api-key.port";

export type ApiKeyDTO = {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
};

export type ApiKeyListDTO = {
  apiKeys: ApiKeyDTO[];
  canManage: boolean;
};

export type CreatedApiKeyDTO = {
  apiKey: ApiKeyDTO;
  key: string;
};

export function toApiKeyDTO(record: ApiKeyRecord): ApiKeyDTO {
  return {
    id: record.id,
    name: record.name,
    start: record.start,
    createdAt: record.createdAt.toISOString(),
    lastUsedAt: record.lastRequestAt?.toISOString() ?? null,
    expiresAt: record.expiresAt?.toISOString() ?? null,
  };
}
