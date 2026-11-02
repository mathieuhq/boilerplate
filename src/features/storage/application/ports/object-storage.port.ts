export type GenerateUploadUrlParams = {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
};

export type GenerateDownloadUrlParams = {
  key: string;
  fileName?: string;
  expiresInSeconds?: number;
};

export type DeleteObjectParams = {
  key: string;
};

export type ObjectMetadata = {
  key: string;
  size: number;
  etag: string;
  lastModified: Date;
  contentType: string;
};

export type GetObjectMetadataParams = {
  key: string;
};

export type DownloadObjectParams = {
  key: string;
};

export type UploadObjectParams = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type IObjectStoragePort = {
  deleteObject: (params: DeleteObjectParams) => Promise<void>;
  uploadObject: (params: UploadObjectParams) => Promise<void>;
  downloadObject: (params: DownloadObjectParams) => Promise<Buffer | null>;
  generateUploadUrl: (params: GenerateUploadUrlParams) => Promise<string>;
  generateDownloadUrl: (params: GenerateDownloadUrlParams) => Promise<string>;
  getObjectMetadata: (
    params: GetObjectMetadataParams,
  ) => Promise<ObjectMetadata | null>;
};
