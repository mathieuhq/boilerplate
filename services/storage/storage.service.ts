import { randomUUID } from "crypto";

import { env } from "@/lib/env";
import { ApplicationError } from "@/lib/errors/application-error";
import { logger } from "@/lib/logger";

import { S3Adapter } from "./adapters/s3.adapter";
import type {
  ListFilesParams,
  Result,
  SignedUrlParams,
  StorageAdapter,
  UploadFileParams,
} from "./adapters/storage-adapter.interface";

export type UploadOptions = {
  /**
   * Original filename for reference
   */
  filename?: string;
  /**
   * Content type (MIME type)
   */
  contentType?: string;
  /**
   * Additional metadata
   */
  metadata?: Record<string, string>;
  /**
   * Generate a unique key using UUID
   * @default true
   */
  generateUniqueKey?: boolean;
  /**
   * Prefix for the file key (e.g., userId, folder path)
   */
  prefix?: string;
};

export type UploadFileResult = {
  key: string;
  url?: string;
  size: number;
  contentType?: string;
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

class StorageService {
  private readonly storageAdapter: StorageAdapter;

  constructor(storageAdapter: StorageAdapter) {
    this.storageAdapter = storageAdapter;
  }

  /**
   * Upload a file with automatic key generation and validation
   */
  async uploadFile(
    file: Buffer | Uint8Array | ReadableStream | string,
    options: UploadOptions = {},
  ): Promise<Result<UploadFileResult>> {
    try {
      const sizeError = this.validateFileSize(file);

      if (sizeError) return { error: sizeError, data: null };

      const keyResult = this.generateFileKey(options);

      if (keyResult.error) return { error: keyResult.error, data: null };

      const uploadParams: UploadFileParams = {
        body: file,
        key: keyResult.data,
        metadata: options.metadata,
        contentType: options.contentType,
      };

      const result = await this.storageAdapter.upload(uploadParams);

      if (result.error) {
        logger.error("[StorageService] Upload failed", {
          error: result.error,
          key: keyResult.data,
        });

        return { error: result.error, data: null };
      }

      logger.info("[StorageService] File uploaded successfully", {
        key: keyResult.data,
        size: result.data.size,
      });

      return {
        error: null,
        data: {
          key: result.data.key,
          size: result.data.size,
          contentType: result.data.contentType,
        },
      };
    } catch (error) {
      logger.error("[StorageService] Unexpected error during upload", {
        error,
      });

      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new ApplicationError("Upload failed"),
      };
    }
  }

  /**
   * Download a file by key
   */
  async downloadFile(key: string) {
    const keyError = this.validateKey(key);
    if (keyError) {
      return { error: keyError, data: null };
    }

    const result = await this.storageAdapter.download(key);

    if (result.error)
      logger.error("[StorageService] Download failed", {
        key,
        error: result.error,
      });
    else logger.info("[StorageService] File downloaded successfully", { key });

    return result;
  }

  /**
   * Delete a file by key
   */
  async deleteFile(key: string) {
    const keyError = this.validateKey(key);
    if (keyError) {
      return { error: keyError, data: null };
    }

    const result = await this.storageAdapter.delete(key);

    if (result.error)
      logger.error("[StorageService] Delete failed", {
        error: result.error,
        key,
      });
    else logger.info("[StorageService] File deleted successfully", { key });

    return result;
  }

  /**
   * Generate a signed URL for temporary access
   */
  async getSignedUrl(params: SignedUrlParams) {
    const keyError = this.validateKey(params.key);
    if (keyError) {
      return { error: keyError, data: null };
    }

    const result = await this.storageAdapter.getSignedUrl(params);

    if (result.error)
      logger.error("[StorageService] Signed URL generation failed", {
        error: result.error,
        key: params.key,
      });

    return result;
  }

  /**
   * List files with optional filtering
   */
  async listFiles(params?: ListFilesParams) {
    const result = await this.storageAdapter.listFiles(params);

    if (result.error)
      logger.error("[StorageService] List files failed", {
        error: result.error,
        params,
      });

    return result;
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string) {
    const keyError = this.validateKey(key);
    if (keyError) {
      return { error: keyError, data: null };
    }

    const result = await this.storageAdapter.fileExists(key);

    if (result.error)
      logger.error("[StorageService] File exists check failed", {
        error: result.error,
        key,
      });

    return result;
  }

  /**
   * Delete multiple files efficiently using bulk API
   */
  async deleteFiles(
    keys: string[],
  ): Promise<Result<{ deleted: string[]; failed: string[] }>> {
    if (keys.length === 0) {
      return { error: null, data: { deleted: [], failed: [] } };
    }

    // Validate all keys first
    const validKeys: string[] = [];
    const invalidKeys: string[] = [];

    for (const key of keys) {
      const keyError = this.validateKey(key);
      if (keyError) {
        invalidKeys.push(key);
        logger.warn("[StorageService] Invalid key in bulk delete", { key });
      } else {
        validKeys.push(key);
      }
    }

    // Use bulk delete API for valid keys
    const result = await this.storageAdapter.bulkDelete(validKeys);

    if (result.error) {
      logger.error("[StorageService] Bulk delete failed", {
        error: result.error,
      });
      return result;
    }

    // Add invalid keys to failed list
    const failed = [...result.data.failed, ...invalidKeys];

    logger.info("[StorageService] Bulk delete completed", {
      total: keys.length,
      deleted: result.data.deleted.length,
      failed: failed.length,
    });

    return {
      error: null,
      data: {
        deleted: result.data.deleted,
        failed,
      },
    };
  }

  /**
   * Validate file key for security and S3 requirements
   */
  private validateKey(key: string): Error | null {
    if (!key || key.trim() === "")
      return new ApplicationError("File key cannot be empty");

    if (key.includes("../") || key.includes("..\\"))
      return new ApplicationError(
        "File key cannot contain path traversal sequences",
      );

    if (key.length > 1024)
      return new ApplicationError(
        "File key exceeds maximum length of 1024 characters",
      );

    return null;
  }

  /**
   * Validate file size for Buffer and Uint8Array
   */
  private validateFileSize(
    file: Buffer | Uint8Array | ReadableStream | string,
  ): Error | null {
    if (file instanceof Buffer || file instanceof Uint8Array)
      if (file.length > MAX_FILE_SIZE)
        return new ApplicationError(
          `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        );

    return null;
  }

  /**
   * Generate file key based on options
   */
  private generateFileKey(options: UploadOptions): Result<string> {
    if (options.generateUniqueKey === false) {
      if (!options.filename)
        return {
          error: new ApplicationError(
            "Filename is required when generateUniqueKey is false",
          ),
          data: null,
        };

      const key = options.prefix
        ? `${options.prefix}/${options.filename}`
        : options.filename;
      return { error: null, data: key };
    }

    const uuid = randomUUID();
    let filename = uuid;

    if (options.filename) {
      const parts = options.filename.split(".");

      if (parts.length > 1 && parts[0] !== "") {
        const extension = parts.slice(1).join(".");
        filename = `${uuid}.${extension}`;
      }
    }

    const key = options.prefix ? `${options.prefix}/${filename}` : filename;

    return { error: null, data: key };
  }
}

// Singleton instances
export const s3Adapter = new S3Adapter({
  region: env.AWS_REGION,
  bucket: env.AWS_S3_BUCKET,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const storageService = new StorageService(s3Adapter);

// Export types
export type { ListFilesParams, SignedUrlParams };
