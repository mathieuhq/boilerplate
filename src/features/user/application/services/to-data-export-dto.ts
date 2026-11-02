import type { DataExport } from "../../domain/entities/data-export.types";
import type { DataExportDTO } from "../dto/data-export.dto";

export function toDataExportDTO(dataExport: DataExport): DataExportDTO {
  return {
    id: dataExport.id,
    status: dataExport.status,
    createdAt: dataExport.createdAt.toISOString(),
    expiresAt: dataExport.expiresAt.toISOString(),
  };
}
