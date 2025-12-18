export type GenerateUploadUrlInputDTO = {
  fileName: string;
  contentType: string;
  fileSize: number;
  prefix?: string;
};

export type GenerateUploadUrlOutputDTO = {
  uploadUrl: string;
  key: string;
  expiresAt: Date;
};

export type GenerateDownloadUrlInputDTO = {
  key: string;
};

export type GenerateDownloadUrlOutputDTO = {
  downloadUrl: string;
  expiresAt: Date;
};

export type DeleteFileInputDTO = {
  key: string;
};

export type DeleteFileOutputDTO = {
  success: boolean;
};
