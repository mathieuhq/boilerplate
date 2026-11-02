export type DataExportReadmeInput = {
  language: string;
  generatedAt: Date;
  expiresAt: Date;
  files: string[];
};

export type IDataExportReadmePort = {
  render: (input: DataExportReadmeInput) => string;
};
