export type GenerateUploadUrlInputDTO = {
  prefix?: string;
  fileName: string;
  fileSize: number;
  contentType: string;
};

export type GenerateUploadUrlOutputDTO = {
  key: string;
  expiresAt: Date;
  uploadUrl: string;
};

export type GenerateDownloadUrlInputDTO = {
  key: string;
  fileName?: string;
  expiresInSeconds?: number;
};

export type GenerateDownloadUrlOutputDTO = {
  expiresAt: Date;
  downloadUrl: string;
};

export type DeleteFileInputDTO = {
  key: string;
};

export type DeleteFileOutputDTO = {
  success: boolean;
};

export type UploadFileInputDTO = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type UploadFileOutputDTO = {
  key: string;
};

export type DownloadFileInputDTO = {
  key: string;
};

export type DownloadFileOutputDTO = {
  body: Buffer | null;
};

export type ProcessAndUploadFileInputDTO = {
  prefix?: string;
  buffer: Buffer;
  contentType: string;
};

export type ProcessAndUploadFileOutputDTO = {
  key: string;
};
