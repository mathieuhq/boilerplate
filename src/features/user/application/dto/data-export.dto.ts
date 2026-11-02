import type { DataExportStatus } from "../../domain/entities/data-export.types";

export type DataExportDTO = {
  id: string;
  status: DataExportStatus;
  createdAt: string;
  expiresAt: string;
};

export type DataExportStatusDTO = {
  latest: DataExportDTO | null;
  nextAvailableAt: string | null;
};
