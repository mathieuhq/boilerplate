export const Language = {
  EN: "EN",
  FR: "FR",
  DE: "DE",
  ES: "ES",
  PT: "PT",
  RU: "RU",
  JA: "JA",
  KO: "KO",
  ZH: "ZH",
} as const;

export type Language = (typeof Language)[keyof typeof Language];

export const NotificationType = {
  ALL: "ALL",
  NONE: "NONE",
  MENTIONS: "MENTIONS",
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const DataExportStatus = {
  PENDING: "PENDING",
  READY: "READY",
  FAILED: "FAILED",
} as const;
