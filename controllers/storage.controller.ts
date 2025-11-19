import { ApplicationError } from "@/lib/errors/application-error";
import { logger } from "@/lib/logger";
import type {
  BulkDeleteFilesInput,
  DeleteFileInput,
  GetSignedUrlInput,
  ListFilesQuery,
  UploadFileInput,
} from "@/schemas/storage/storage.schema";
import { storageService } from "@/services/storage/storage.service";

/**
 * Controller layer for storage operations with user-scoped access control
 * All file keys are automatically prefixed with users/{userId}/
 * Validates ownership to ensure users can only access their own files
 */
export class StorageController {
  /**
   * Uploads a file with automatic user scoping
   */
  async uploadFile(userId: string, input: UploadFileInput) {
    const { file, filename, contentType, metadata, prefix } = input;

    let fileBuffer: Buffer | Uint8Array;

    if (typeof file === "string") fileBuffer = Buffer.from(file, "base64");
    else fileBuffer = file;

    const userPrefix = this.getUserPrefix(userId);
    const fullPrefix = prefix ? `${userPrefix}${prefix}` : userPrefix;

    const result = await storageService.uploadFile(fileBuffer, {
      filename,
      metadata,
      contentType,
      prefix: fullPrefix,
      generateUniqueKey: true,
    });

    if (result.error) {
      logger.error("[StorageController] File upload failed", {
        userId,
        error: result.error,
      });

      throw new ApplicationError("Failed to upload file");
    }

    logger.info("[StorageController] File uploaded successfully", {
      userId,
      key: result.data.key,
      size: result.data.size,
    });

    return result.data;
  }

  /**
   * Deletes a file after validating ownership
   */
  async deleteFile(userId: string, input: DeleteFileInput) {
    const { key } = input;

    this.validateOwnership(userId, key);

    const result = await storageService.deleteFile(key);

    if (result.error) {
      logger.error("[StorageController] File deletion failed", {
        key,
        userId,
        error: result.error,
      });

      throw new ApplicationError("Failed to delete file");
    }

    logger.info("[StorageController] File deleted successfully", {
      key,
      userId,
    });

    return {
      success: true,
      message: "File deleted successfully",
    };
  }

  /**
   * Deletes multiple files after validating ownership of all keys
   */
  async deleteFiles(userId: string, input: BulkDeleteFilesInput) {
    const { keys } = input;

    this.validateKeysOwnership(userId, keys);

    const result = await storageService.deleteFiles(keys);

    if (result.error) {
      logger.error("[StorageController] Bulk deletion failed", {
        userId,
        error: result.error,
        keysCount: keys.length,
      });

      throw new ApplicationError("Failed to delete files");
    }

    logger.info("[StorageController] Bulk deletion completed", {
      userId,
      failed: result.data.failed.length,
      deleted: result.data.deleted.length,
    });

    return result.data;
  }

  /**
   * Generates a signed URL after validating ownership
   */
  async getSignedUrl(userId: string, input: GetSignedUrlInput) {
    const { key, expiresIn, operation } = input;

    // Validate ownership
    this.validateOwnership(userId, key);

    const result = await storageService.getSignedUrl({
      key,
      expiresIn,
      operation,
    });

    if (result.error) {
      logger.error("[StorageController] Signed URL generation failed", {
        key,
        userId,
        error: result.error,
      });

      throw new ApplicationError("Failed to generate signed URL");
    }

    logger.info("[StorageController] Signed URL generated", {
      key,
      userId,
      expiresIn,
      operation,
    });

    return {
      url: result.data,
      expiresIn,
    };
  }

  /**
   * Lists files with automatic user scoping
   */
  async listFiles(userId: string, query: ListFilesQuery) {
    const { prefix, maxKeys, continuationToken } = query;

    const userPrefix = this.getUserPrefix(userId);
    const fullPrefix = prefix ? `${userPrefix}${prefix}` : userPrefix;

    const result = await storageService.listFiles({
      maxKeys,
      continuationToken,
      prefix: fullPrefix,
    });

    if (result.error) {
      logger.error("[StorageController] File listing failed", {
        userId,
        error: result.error,
      });

      throw new ApplicationError("Failed to list files");
    }

    logger.info("[StorageController] Files listed", {
      userId,
      count: result.data.files.length,
      isTruncated: result.data.isTruncated,
    });

    return result.data;
  }

  /**
   * Checks if a file exists after validating ownership
   */
  async fileExists(userId: string, key: string) {
    // Validate ownership
    this.validateOwnership(userId, key);

    const result = await storageService.fileExists(key);

    if (result.error) {
      logger.error("[StorageController] File existence check failed", {
        userId,
        key,
        error: result.error,
      });

      throw new ApplicationError("Failed to check file existence");
    }

    return {
      exists: result.data,
      key,
    };
  }

  /**
   * Downloads a file after validating ownership
   * Returns the file metadata and body stream
   */
  async downloadFile(userId: string, key: string) {
    // Validate ownership
    this.validateOwnership(userId, key);

    const result = await storageService.downloadFile(key);

    if (result.error) {
      logger.error("[StorageController] File download failed", {
        userId,
        key,
        error: result.error,
      });

      throw new ApplicationError("Failed to download file");
    }

    logger.info("[StorageController] File downloaded", {
      userId,
      key,
      size: result.data.metadata.size,
    });

    return result.data;
  }

  /**
   * Gets the user prefix for scoped storage
   */
  private getUserPrefix(userId: string): string {
    return `users/${userId}/`;
  }

  /**
   * Validates that a file key belongs to the user
   * Throws ApplicationError if the key doesn't start with users/{userId}/
   */
  private validateOwnership(userId: string, key: string): void {
    const userPrefix = this.getUserPrefix(userId);

    if (!key.startsWith(userPrefix)) {
      logger.warn("[StorageController] Unauthorized file access attempt", {
        key,
        userId,
        expectedPrefix: userPrefix,
      });

      throw new ApplicationError(
        "You don't have permission to access this file",
      );
    }
  }

  /**
   * Validates that all keys in an array belong to the user
   */
  private validateKeysOwnership(userId: string, keys: string[]): void {
    for (const key of keys) this.validateOwnership(userId, key);
  }
}

export const storageController = new StorageController();
