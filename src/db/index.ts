export * from "./client";
export * from "./schema";
export * from "./utils";

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type {
  accounts,
  languageEnum,
  notificationTypeEnum,
  sessions,
  subscriptions,
  users,
  verifications,
} from "./schema";

export type Language = (typeof languageEnum.enumValues)[number];
export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

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

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;

export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;

export type Verification = InferSelectModel<typeof verifications>;
export type NewVerification = InferInsertModel<typeof verifications>;

export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
