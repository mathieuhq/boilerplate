import crypto from "crypto";

import { env } from "@/lib/env";
import { ApplicationError } from "@/lib/errors/application-error";
import { logger } from "@/lib/logger";

/**
 * Result of encryption operation
 */
export type EncryptionResult = {
  iv: string;
  authTag: string;
  encryptedData: string;
};

/**
 * Service layer for encryption/decryption operations using AES-256-GCM
 */
class EncryptionService {
  private readonly keyBuffer: Buffer;
  private readonly algorithm = "aes-256-gcm";

  constructor() {
    this.keyBuffer = Buffer.from(env.ENCRYPTION_KEY, "hex");

    if (this.keyBuffer.length !== 32)
      throw new ApplicationError(
        "ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)",
      );
  }

  /**
   * Encrypts data using AES-256-GCM
   * @param plaintext - The data to encrypt
   * @returns Object containing encrypted data, IV, and auth tag
   */
  encrypt(plaintext: string): EncryptionResult {
    try {
      const iv = crypto.randomBytes(12);

      const cipher = crypto.createCipheriv(this.algorithm, this.keyBuffer, iv);

      let encrypted = cipher.update(plaintext, "utf8", "hex");

      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      logger.info("[EncryptionService] Data encrypted successfully");

      return {
        iv: iv.toString("hex"),
        encryptedData: encrypted,
        authTag: authTag.toString("hex"),
      };
    } catch (error) {
      logger.error("[EncryptionService] Encryption failed", { error });

      throw new ApplicationError("Failed to encrypt data");
    }
  }

  /**
   * Decrypts data using AES-256-GCM
   * @param encryptedData - The encrypted data (hex string)
   * @param iv - The initialization vector (hex string)
   * @param authTag - The authentication tag (hex string)
   * @returns Decrypted plaintext
   */
  decrypt(encryptedData: string, iv: string, authTag: string): string {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.keyBuffer,
        Buffer.from(iv, "hex"),
      );

      decipher.setAuthTag(Buffer.from(authTag, "hex"));

      let decrypted = decipher.update(encryptedData, "hex", "utf8");

      decrypted += decipher.final("utf8");

      logger.info("[EncryptionService] Data decrypted successfully");

      return decrypted;
    } catch (error) {
      logger.error("[EncryptionService] Decryption failed", { error });

      throw new ApplicationError(
        "Failed to decrypt data - data may be corrupted",
      );
    }
  }
}

// Singleton instance
export const encryptionService = new EncryptionService();
