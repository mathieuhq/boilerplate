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
