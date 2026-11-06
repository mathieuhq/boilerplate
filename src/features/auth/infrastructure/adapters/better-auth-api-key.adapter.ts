import { and, desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import type { Database } from "@/lib/db";
import { apikey, user } from "@/lib/schema";

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
  id: apikey.id,
  name: apikey.name,
  start: apikey.start,
  expiresAt: apikey.expiresAt,
  createdAt: apikey.createdAt,
  referenceId: apikey.referenceId,
  lastRequest: apikey.lastRequest,
};

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
  constructor(private readonly db: Database) {}

  async verifyApiKey(key: string): Promise<ApiKeyVerification> {
    const result = await auth.api.verifyApiKey({ body: { key } });

    if (result.error?.code === "RATE_LIMITED")
      return { status: "rate_limited" };

    if (!result.valid || !result.key) return { status: "invalid" };

    const owner = await this.db.query.user.findFirst({
      where: eq(user.id, result.key.referenceId),
      columns: {
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
    const apiKeys = await this.db
      .select(API_KEY_SELECT)
      .from(apikey)
      .where(eq(apikey.referenceId, userId))
      .orderBy(desc(apikey.createdAt));

    return apiKeys.map(toApiKeyRecord);
  }

  async createApiKey(userId: string, name: string): Promise<CreatedApiKey> {
    const { key, ...apiKey } = await auth.api.createApiKey({
      body: { name, userId, expiresIn: API_KEY_EXPIRES_IN_SECONDS },
    });

    return { key, record: toApiKeyRecord(apiKey) };
  }

  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(apikey)
      .where(and(eq(apikey.id, keyId), eq(apikey.referenceId, userId)))
      .returning({ id: apikey.id });

    return deleted.length > 0;
  }
}
