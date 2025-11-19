import { ApplicationError } from "@/lib/errors/application-error";
import { logger } from "@/lib/logger";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  DownloadFileResult,
  FileMetadata,
  ListFilesParams,
  ListFilesResult,
  Result,
  SignedUrlParams,
  StorageAdapter,
  UploadFileParams,
} from "./storage-adapter.interface";

type S3AdapterConfig = {
  region: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
};

export class S3Adapter implements StorageAdapter {
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(config: S3AdapterConfig) {
    this.bucket = config.bucket;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: config.credentials,
    });
  }

  /**
   * Get direct access to S3Client if needed
   */
  getS3Client(): S3Client {
    return this.s3Client;
  }

  async upload(params: UploadFileParams): Promise<Result<FileMetadata>> {
    try {
      let size = 0;

      if (params.body instanceof Buffer || params.body instanceof Uint8Array) {
        size = params.body.length;
      } else if (typeof params.body === "string") {
        size = Buffer.byteLength(params.body);
      }

      const command = new PutObjectCommand({
        Key: params.key,
        Body: params.body,
        Bucket: this.bucket,
        Metadata: params.metadata,
        ContentType: params.contentType,
      });

      const response = await this.s3Client.send(command);

      logger.debug("[S3Adapter] File uploaded successfully", {
        size,
        key: params.key,
        etag: response.ETag,
      });

      return {
        error: null,
        data: {
          size,
          key: params.key,
          etag: response.ETag,
          lastModified: new Date(),
          contentType: params.contentType,
        },
      };
    } catch (error) {
      logger.error("[S3Adapter] Upload failed", { error, key: params.key });

      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new ApplicationError("Upload failed"),
      };
    }
  }

  async download(key: string): Promise<Result<DownloadFileResult>> {
    try {
      const command = new GetObjectCommand({
        Key: key,
        Bucket: this.bucket,
      });

      const response = await this.s3Client.send(command);

      logger.debug("[S3Adapter] File downloaded successfully", { key });

      return {
        error: null,
        data: {
          body: response.Body?.transformToWebStream() ?? null,
          metadata: {
            key,
            etag: response.ETag,
            size: response.ContentLength ?? 0,
            contentType: response.ContentType,
            lastModified: response.LastModified,
          },
        },
      };
    } catch (error) {
      logger.error("[S3Adapter] Download failed", { error, key });

      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new ApplicationError("Download failed"),
      };
    }
  }

  async delete(key: string): Promise<Result<void>> {
    try {
      const command = new DeleteObjectCommand({
        Key: key,
        Bucket: this.bucket,
      });

      await this.s3Client.send(command);

      logger.debug("[S3Adapter] File deleted successfully", { key });

      return { error: null, data: undefined };
    } catch (error) {
      logger.error("[S3Adapter] Delete failed", { error, key });

      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new ApplicationError("Delete failed"),
      };
    }
  }

  /**
   * Delete multiple files in a single API call (up to 1000 files per batch)
   */
  async bulkDelete(
    keys: string[],
  ): Promise<Result<{ deleted: string[]; failed: string[] }>> {
    if (keys.length === 0)
      return { error: null, data: { deleted: [], failed: [] } };

    const deleted: string[] = [];
    const failed: string[] = [];

    const batchSize = 1000;
    const batches: string[][] = [];

    for (let i = 0; i < keys.length; i += batchSize)
      batches.push(keys.slice(i, i + batchSize));

    const results = await Promise.allSettled(
      batches.map(async (batch) =>
        this.s3Client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
              Quiet: false,
              Objects: batch.map((key) => ({ Key: key })),
            },
          }),
        ),
      ),
    );

    results.forEach((result, index) => {
      const batch = batches[index];

      if (result.status === "fulfilled") {
        const response = result.value;

        if (response.Deleted)
          response.Deleted.forEach((obj) => {
            if (obj.Key) deleted.push(obj.Key);
          });

        if (response.Errors) {
          response.Errors.forEach((error) => {
            if (error.Key) failed.push(error.Key);

            logger.warn("[S3Adapter] Failed to delete file", {
              key: error.Key,
              code: error.Code,
              message: error.Message,
            });
          });
        }
      } else {
        logger.error("[S3Adapter] Bulk delete batch failed", {
          error: result.reason,
          batchSize: batch.length,
        });
        failed.push(...batch);
      }
    });

    logger.info("[S3Adapter] Bulk delete completed", {
      total: keys.length,
      failed: failed.length,
      deleted: deleted.length,
    });

    return { error: null, data: { deleted, failed } };
  }

  async getSignedUrl(params: SignedUrlParams): Promise<Result<string>> {
    try {
      const expiresIn = params.expiresIn ?? 3600;
      const operation = params.operation ?? "getObject";

      const command =
        operation === "putObject"
          ? new PutObjectCommand({
              Key: params.key,
              Bucket: this.bucket,
            })
          : new GetObjectCommand({
              Key: params.key,
              Bucket: this.bucket,
            });

      const signedUrl = await getS3SignedUrl(this.s3Client, command, {
        expiresIn,
      });

      logger.debug("[S3Adapter] Signed URL generated", {
        operation,
        expiresIn,
        key: params.key,
      });

      return { error: null, data: signedUrl };
    } catch (error) {
      logger.error("[S3Adapter] Generate signed URL failed", {
        error,
        key: params.key,
      });

      return {
        error:
          error instanceof Error
            ? error
            : new ApplicationError("Signed URL generation failed"),
        data: null,
      };
    }
  }

  async listFiles(params?: ListFilesParams): Promise<Result<ListFilesResult>> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: params?.prefix,
        MaxKeys: params?.maxKeys,
        ContinuationToken: params?.continuationToken,
      });

      const response = await this.s3Client.send(command);

      const files: FileMetadata[] =
        response.Contents?.map((obj) => ({
          etag: obj.ETag,
          key: obj.Key ?? "",
          size: obj.Size ?? 0,
          lastModified: obj.LastModified,
        })) ?? [];

      logger.debug("[S3Adapter] Files listed successfully", {
        prefix: params?.prefix,
        count: files.length,
      });

      return {
        error: null,
        data: {
          files,
          isTruncated: response.IsTruncated ?? false,
          continuationToken: response.NextContinuationToken,
        },
      };
    } catch (error) {
      logger.error("[S3Adapter] List files failed", { error, params });

      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new ApplicationError("List files failed"),
      };
    }
  }

  async fileExists(key: string): Promise<Result<boolean>> {
    try {
      const command = new HeadObjectCommand({
        Key: key,
        Bucket: this.bucket,
      });

      await this.s3Client.send(command);

      logger.debug("[S3Adapter] File exists check: true", { key });

      return { error: null, data: true };
    } catch (error) {
      logger.error("[S3Adapter] File exists check failed", {
        key,
        error,
      });

      return {
        error:
          error instanceof Error
            ? error
            : new ApplicationError("File exists check failed"),
        data: null,
      };
    }
  }
}
