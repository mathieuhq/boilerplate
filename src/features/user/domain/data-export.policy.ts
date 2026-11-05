import type { DataExport } from "./entities/data-export.types";

const HOUR_MS = 60 * 60 * 1000;

export const DATA_EXPORT_COOLDOWN_MS = 24 * HOUR_MS;
export const DATA_EXPORT_RETENTION_MS = 7 * 24 * HOUR_MS;
export const DATA_EXPORT_DOWNLOAD_URL_TTL_SECONDS = 5 * 60;
const DATA_EXPORT_STORAGE_PREFIX = "data-exports";

export function getNextDataExportAt(
  latest: DataExport | null,
  now: Date,
): Date | null {
  if (!latest || latest.status === "failed") return null;

  const nextAt = new Date(latest.createdAt.getTime() + DATA_EXPORT_COOLDOWN_MS);

  return nextAt > now ? nextAt : null;
}

export function getDataExportExpiresAt(from: Date): Date {
  return new Date(from.getTime() + DATA_EXPORT_RETENTION_MS);
}

export function isDataExportExpired(dataExport: DataExport, now: Date) {
  return dataExport.expiresAt <= now;
}

export function getDataExportFileKey(userId: string, exportId: string) {
  return `${DATA_EXPORT_STORAGE_PREFIX}/${userId}/${exportId}.zip`;
}

export function getDataExportFileName(createdAt: Date) {
  return `data-export-${createdAt.toISOString().slice(0, 10)}.zip`;
}

export function getDataExportDownloadPath(exportId: string) {
  return `/api/v1/private/user/export/${exportId}`;
}
