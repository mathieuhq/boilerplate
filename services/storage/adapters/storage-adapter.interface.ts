export type Result<T> = { error: null; data: T } | { error: Error; data: null };

export type FileMetadata = {
  key: string;
  size: number;
  etag?: string;
  lastModified?: Date;
  contentType?: string;
};

export type UploadFileParams = {
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
  body: Buffer | Uint8Array | ReadableStream | string;
};

export type DownloadFileResult = {
  metadata: FileMetadata;
  body: ReadableStream | null;
};

export type SignedUrlParams = {
  key: string;
  expiresIn?: number;
  operation?: "getObject" | "putObject";
};

export type ListFilesParams = {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
};

export type ListFilesResult = {
  isTruncated: boolean;
  files: FileMetadata[];
  continuationToken?: string;
};

export type StorageAdapter = {
  /**
   * Upload a file to storage
   */
  upload: (params: UploadFileParams) => Promise<Result<FileMetadata>>;

  /**
   * Download a file from storage
   */
  download: (key: string) => Promise<Result<DownloadFileResult>>;

  /**
   * Delete a file from storage
   */
  delete: (key: string) => Promise<Result<void>>;

  /**
   * Delete multiple files from storage (bulk operation)
   */
  bulkDelete: (
    keys: string[],
  ) => Promise<Result<{ deleted: string[]; failed: string[] }>>;

  /**
   * Generate a signed URL for temporary access
   */
  getSignedUrl: (params: SignedUrlParams) => Promise<Result<string>>;

  /**
   * List files in storage
   */
  listFiles: (params?: ListFilesParams) => Promise<Result<ListFilesResult>>;

  /**
   * Check if a file exists
   */
  fileExists: (key: string) => Promise<Result<boolean>>;
};
