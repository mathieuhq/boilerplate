import { randomUUID } from "crypto";

import { db } from "@/lib/db";

type CreateIntegrationParams = {
  userId: string;
  provider: string;
  encryptedApiKey: string;
  iv: string;
  authTag: string;
};

type UpdateIntegrationParams = {
  encryptedApiKey?: string;
  iv?: string;
  authTag?: string;
  status?: string;
};

/**
 * Service layer for integration data operations
 */
class IntegrationService {
  /**
   * Gets all integrations for a user
   */
  async getUserIntegrations(userId: string) {
    const integrations = await db.integration.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        provider: true,
        updatedAt: true,
        connectedAt: true,
        disconnectedAt: true,
      },
      orderBy: { connectedAt: "desc" },
    });

    return integrations;
  }

  /**
   * Gets a specific integration by user ID and provider
   */
  async getIntegrationByProvider(userId: string, provider: string) {
    const integration = await db.integration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      select: {
        id: true,
        iv: true,
        status: true,
        provider: true,
        updatedAt: true,
        connectedAt: true,
        disconnectedAt: true,
        encryptedApiKey: true,
      },
    });

    return integration;
  }

  /**
   * Gets encrypted API key data for decryption
   */
  async getEncryptedApiKey(userId: string, provider: string) {
    const integration = await db.integration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      select: {
        iv: true,
        authTag: true,
        encryptedApiKey: true,
      },
    });

    return integration;
  }

  /**
   * Creates a new integration
   */
  async createIntegration(params: CreateIntegrationParams) {
    const integration = await db.integration.create({
      data: {
        iv: params.iv,
        id: randomUUID(),
        status: "connected",
        userId: params.userId,
        authTag: params.authTag,
        provider: params.provider,
        encryptedApiKey: params.encryptedApiKey,
      },
      select: {
        id: true,
        status: true,
        provider: true,
        updatedAt: true,
        connectedAt: true,
      },
    });

    return integration;
  }

  /**
   * Updates an existing integration
   */
  async updateIntegration(
    userId: string,
    provider: string,
    data: UpdateIntegrationParams,
  ) {
    const integration = await db.integration.update({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
      data: {
        ...(data.iv && { iv: data.iv }),
        ...(data.status && { status: data.status }),
        ...(data.authTag && { authTag: data.authTag }),
        ...(data.encryptedApiKey && { encryptedApiKey: data.encryptedApiKey }),
      },
      select: {
        id: true,
        status: true,
        provider: true,
        updatedAt: true,
        connectedAt: true,
      },
    });

    return integration;
  }

  /**
   * Deletes an integration
   */
  async deleteIntegration(userId: string, provider: string) {
    await db.integration.delete({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    return { success: true };
  }

  /**
   * Checks if an integration exists for a user
   */
  async hasIntegration(userId: string, provider: string): Promise<boolean> {
    const count = await db.integration.count({
      where: {
        userId,
        provider,
      },
    });

    return count > 0;
  }
}

export const integrationService = new IntegrationService();
