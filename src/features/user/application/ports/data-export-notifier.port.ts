export type DataExportReadyNotification = {
  exportId: string;
  userId: string;
  email: string;
  name: string;
  language: string;
  expiresAt: Date;
};

export type IDataExportNotifierPort = {
  notifyReady: (input: DataExportReadyNotification) => Promise<void>;
};
