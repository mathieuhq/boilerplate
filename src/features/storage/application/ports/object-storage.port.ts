export type GenerateUploadUrlParams = {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
};

export type GenerateDownloadUrlParams = {
  key: string;
  expiresInSeconds?: number;
};

export type DeleteObjectParams = {
  key: string;
};

export type ObjectMetadata = {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
};

export type GetObjectMetadataParams = {
  key: string;
};

export type IObjectStoragePort = {
  generateUploadUrl: (params: GenerateUploadUrlParams) => Promise<string>;
  generateDownloadUrl: (params: GenerateDownloadUrlParams) => Promise<string>;
  deleteObject: (params: DeleteObjectParams) => Promise<void>;
  getObjectMetadata: (
    params: GetObjectMetadataParams,
  ) => Promise<ObjectMetadata | null>;
};
