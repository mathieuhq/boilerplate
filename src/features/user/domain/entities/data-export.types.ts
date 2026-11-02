export type DataExportStatus = "pending" | "ready" | "failed";

export type DataExport = {
  id: string;
  userId: string | null;
  status: DataExportStatus;
  fileKey: string | null;
  size: number | null;
  createdAt: Date;
  completedAt: Date | null;
  expiresAt: Date;
};
