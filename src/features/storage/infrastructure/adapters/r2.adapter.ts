import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  DeleteObjectParams,
  DownloadObjectParams,
  GenerateDownloadUrlParams,
  GenerateUploadUrlParams,
  GetObjectMetadataParams,
  IObjectStoragePort,
  ObjectMetadata,
  UploadObjectParams,
} from "../../application/ports/object-storage.port";

type R2AdapterConfig = {
  endpoint: string;
  forcePathStyle: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
};

export class R2Adapter implements IObjectStoragePort {
  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(config: R2AdapterConfig) {
    this.bucketName = config.bucketName;
    this.client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      requestChecksumCalculation: "WHEN_REQUIRED",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async generateUploadUrl(params: GenerateUploadUrlParams): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
      ContentType: params.contentType,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds ?? 3600,
    });

    return url;
  }

  async generateDownloadUrl(
    params: GenerateDownloadUrlParams,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
      ResponseContentDisposition: params.fileName
        ? `attachment; filename="${params.fileName}"`
        : undefined,
    });

    const url = await getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds ?? 3600,
    });

    return url;
  }

  async deleteObject(params: DeleteObjectParams): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: params.key,
    });

    await this.client.send(command);
  }

  async getObjectMetadata(
    params: GetObjectMetadataParams,
  ): Promise<ObjectMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: params.key,
      });

      const response = await this.client.send(command);

      return {
        key: params.key,
        etag: response.ETag ?? "",
        size: response.ContentLength ?? 0,
        lastModified: response.LastModified ?? new Date(),
        contentType: response.ContentType ?? "application/octet-stream",
      };
    } catch (error) {
      if (error instanceof Error && error.name === "NotFound") return null;
      throw error;
    }
  }

  async downloadObject(params: DownloadObjectParams): Promise<Buffer | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: params.key,
      });

      const response = await this.client.send(command);

      if (!response.Body) return null;

      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") return null;
      throw error;
    }
  }

  async uploadObject(params: UploadObjectParams): Promise<void> {
    const command = new PutObjectCommand({
      Key: params.key,
      Body: params.body,
      Bucket: this.bucketName,
      ContentType: params.contentType,
    });

    await this.client.send(command);
  }
}
