export type IDataExportStoragePort = {
  upload: (input: {
    key: string;
    body: Buffer;
    contentType: string;
  }) => Promise<void>;
  download: (key: string) => Promise<Buffer | null>;
  delete: (key: string) => Promise<void>;
  getDownloadUrl: (input: {
    key: string;
    fileName: string;
    expiresInSeconds: number;
  }) => Promise<string>;
};
