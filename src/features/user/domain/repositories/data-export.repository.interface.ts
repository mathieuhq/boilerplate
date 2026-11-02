import type {
  DataExport,
  DataExportStatus,
} from "../entities/data-export.types";

export type CreateDataExportInput = {
  userId: string;
  expiresAt: Date;
};

export type MarkDataExportReadyInput = {
  fileKey: string;
  size: number;
  completedAt: Date;
  expiresAt: Date;
};

export type IDataExportRepository = {
  create: (input: CreateDataExportInput) => Promise<DataExport>;
  findById: (id: string) => Promise<DataExport | null>;
  findLatestByUserId: (
    userId: string,
    statuses: DataExportStatus[],
  ) => Promise<DataExport | null>;
  markReady: (
    id: string,
    input: MarkDataExportReadyInput,
  ) => Promise<DataExport>;
  markFailed: (id: string) => Promise<void>;
  findExpired: (now: Date, limit: number) => Promise<DataExport[]>;
  deleteMany: (ids: string[]) => Promise<number>;
};
