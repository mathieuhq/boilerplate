export type Language =
  | "EN"
  | "FR"
  | "DE"
  | "ES"
  | "PT"
  | "RU"
  | "JA"
  | "KO"
  | "ZH";

export type NotificationType = "ALL" | "NONE" | "MENTIONS";

export const Language = {
  EN: "EN" as const,
  FR: "FR" as const,
  DE: "DE" as const,
  ES: "ES" as const,
  PT: "PT" as const,
  RU: "RU" as const,
  JA: "JA" as const,
  KO: "KO" as const,
  ZH: "ZH" as const,
} as const;

export const NotificationType = {
  ALL: "ALL" as const,
  NONE: "NONE" as const,
  MENTIONS: "MENTIONS" as const,
} as const;
