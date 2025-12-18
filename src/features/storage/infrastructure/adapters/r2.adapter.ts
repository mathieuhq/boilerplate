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
  GenerateDownloadUrlParams,
  GenerateUploadUrlParams,
  GetObjectMetadataParams,
  IObjectStoragePort,
  ObjectMetadata,
} from "../../application/ports/object-storage.port";

type R2AdapterConfig = {
  accountId: string;
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
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
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
}
