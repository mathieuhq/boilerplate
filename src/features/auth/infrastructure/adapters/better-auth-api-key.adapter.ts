import { auth } from "@/lib/auth";
import type { PrismaClient } from "@/lib/generated/prisma/client";

import type {
  ApiKeyRecord,
  ApiKeyVerification,
  CreatedApiKey,
  IApiKeyPort,
} from "../../application/ports/api-key.port";

const API_KEY_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 90;

type StoredApiKey = {
  id: string;
  createdAt: Date;
  referenceId: string;
  name: string | null;
  start: string | null;
  expiresAt: Date | null;
  lastRequest: Date | null;
};

const API_KEY_SELECT = {
  id: true,
  name: true,
  start: true,
  expiresAt: true,
  createdAt: true,
  referenceId: true,
  lastRequest: true,
} as const;

function toApiKeyRecord(apiKey: StoredApiKey): ApiKeyRecord {
  return {
    id: apiKey.id,
    name: apiKey.name,
    start: apiKey.start,
    userId: apiKey.referenceId,
    createdAt: new Date(apiKey.createdAt),
    expiresAt: apiKey.expiresAt ? new Date(apiKey.expiresAt) : null,
    lastRequestAt: apiKey.lastRequest ? new Date(apiKey.lastRequest) : null,
  };
}

export class BetterAuthApiKeyAdapter implements IApiKeyPort {
  constructor(private readonly db: PrismaClient) {}

  async verifyApiKey(key: string): Promise<ApiKeyVerification> {
    const result = await auth.api.verifyApiKey({ body: { key } });

    if (result.error?.code === "RATE_LIMITED")
      return { status: "rate_limited" };

    if (!result.valid || !result.key) return { status: "invalid" };

    const owner = await this.db.user.findUnique({
      where: { id: result.key.referenceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        banned: true,
        banExpires: true,
      },
    });

    if (!owner) return { status: "invalid" };

    return {
      status: "valid",
      keyId: result.key.id,
      owner: { ...owner, banned: owner.banned ?? false },
    };
  }

  async listApiKeys(userId: string): Promise<ApiKeyRecord[]> {
    const apiKeys = await this.db.apikey.findMany({
      where: { referenceId: userId },
      select: API_KEY_SELECT,
      orderBy: { createdAt: "desc" },
    });

    return apiKeys.map(toApiKeyRecord);
  }

  async createApiKey(userId: string, name: string): Promise<CreatedApiKey> {
    const { key, ...apiKey } = await auth.api.createApiKey({
      body: { name, userId, expiresIn: API_KEY_EXPIRES_IN_SECONDS },
    });

    return { key, record: toApiKeyRecord(apiKey) };
  }

  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    const { count } = await this.db.apikey.deleteMany({
      where: { id: keyId, referenceId: userId },
    });

    return count > 0;
  }
}
