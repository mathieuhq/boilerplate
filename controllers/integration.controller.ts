import { ApplicationError } from "@/lib/errors/application-error";
import { logger } from "@/lib/logger";
import type {
  DisconnectIntegrationInput,
  SaveHabitDashKeyInput,
} from "@/schemas/integration/integration.schema";
import { INTEGRATION_PROVIDERS } from "@/schemas/integration/integration.schema";
import { encryptionService } from "@/services/encryption/encryption.service";
import { integrationService } from "@/services/integration/integration.service";

/**
 * Controller layer for integration operations (business logic)
 * Accepts already validated data from routes/actions
 */
export class IntegrationController {
  /**
   * Gets all connected integrations for a user
   */
  async getUserIntegrations(userId: string) {
    const integrations = await integrationService.getUserIntegrations(userId);

    return integrations;
  }

  /**
   * Saves a Habit Dash API key for a user (encrypted)
   */
  async saveHabitDashKey(userId: string, input: SaveHabitDashKeyInput) {
    const provider = INTEGRATION_PROVIDERS.HABIT_DASH;

    try {
      const existingIntegration =
        await integrationService.getIntegrationByProvider(userId, provider);

      const { encryptedData, iv, authTag } = encryptionService.encrypt(
        input.apiKey,
      );

      let integration;

      if (existingIntegration) {
        integration = await integrationService.updateIntegration(
          userId,
          provider,
          {
            iv,
            authTag,
            status: "connected",
            encryptedApiKey: encryptedData,
          },
        );

        logger.info("[IntegrationController] Habit Dash API key updated", {
          userId,
          provider,
        });
      } else {
        integration = await integrationService.createIntegration({
          iv,
          userId,
          authTag,
          provider,
          encryptedApiKey: encryptedData,
        });

        logger.info("[IntegrationController] Habit Dash API key saved", {
          userId,
          provider,
        });
      }

      return {
        success: true,
        data: integration,
        message: "API key saved successfully",
      };
    } catch (error) {
      logger.error("[IntegrationController] Failed to save API key", {
        error,
        userId,
        provider,
      });

      throw new ApplicationError("Failed to save API key");
    }
  }

  /**
   * Disconnects an integration by deleting it
   */
  async disconnectIntegration(
    userId: string,
    input: DisconnectIntegrationInput,
  ) {
    const { provider } = input;

    const hasIntegration = await integrationService.hasIntegration(
      userId,
      provider,
    );

    if (!hasIntegration) throw new ApplicationError("Integration not found");

    await integrationService.deleteIntegration(userId, provider);

    logger.info("[IntegrationController] Integration disconnected", {
      userId,
      provider,
    });

    return {
      success: true,
      message: "Integration disconnected successfully",
    };
  }

  /**
   * Gets decrypted API key for a specific integration (for internal use)
   * WARNING: This should only be used server-side and never expose the key to the client
   */
  async getDecryptedApiKey(userId: string, provider: string): Promise<string> {
    const integration = await integrationService.getEncryptedApiKey(
      userId,
      provider,
    );

    if (!integration) throw new ApplicationError("Integration not found");

    try {
      const decryptedApiKey = encryptionService.decrypt(
        integration.encryptedApiKey,
        integration.iv,
        integration.authTag,
      );

      return decryptedApiKey;
    } catch (error) {
      logger.error("[IntegrationController] Failed to decrypt API key", {
        error,
        userId,
        provider,
      });

      throw new ApplicationError(
        "Failed to decrypt API key - please reconnect the integration",
      );
    }
  }
}

export const integrationController = new IntegrationController();
