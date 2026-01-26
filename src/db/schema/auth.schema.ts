import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { cuid } from "../utils";

export const languageEnum = pgEnum("language", [
  "EN",
  "FR",
  "DE",
  "ES",
  "PT",
  "RU",
  "JA",
  "KO",
  "ZH",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "ALL",
  "NONE",
  "MENTIONS",
]);

export const users = pgTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").default(false),
    image: text("image"),
    language: languageEnum("language").default("EN"),
    birthDate: timestamp("birth_date", { mode: "date" }),
    stripeCustomerId: text("stripe_customer_id"),
    resendContactId: text("resend_contact_id"),
    communicationEmails: boolean("communication_emails").default(true),
    marketingEmails: boolean("marketing_emails").default(true),
    socialEmails: boolean("social_emails").default(true),
    securityEmails: boolean("security_emails").default(true),
    notificationType: notificationTypeEnum("notification_type").default("ALL"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
    lastLoginAt: timestamp("last_login_at"),
    deletedAt: timestamp("deleted_at"),
    role: text("role"),
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
  },
  (table) => ({
    emailUnique: unique().on(table.email),
    stripeCustomerIdIdx: index().on(table.stripeCustomerId),
    resendContactIdIdx: index().on(table.resendContactId),
    deletedAtIdx: index().on(table.deletedAt),
  }),
);

export const sessions = pgTable(
  "session",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    token: text("token").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
    expiresAt: timestamp("expires_at").notNull(),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => ({
    tokenUnique: unique().on(table.token),
    userIdIdx: index().on(table.userId),
    userIdExpiresAtIdx: index().on(table.userId, table.expiresAt),
  }),
);

export const accounts = pgTable(
  "account",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  },
  (table) => ({
    uniqueAccount: unique().on(table.userId, table.providerId, table.accountId),
    userIdIdx: index().on(table.userId),
    providerAccountIdx: index().on(table.providerId, table.accountId),
  }),
);

export const verifications = pgTable(
  "verification",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (table) => ({
    identifierIdx: index().on(table.identifier),
    identifierExpiresAtIdx: index().on(table.identifier, table.expiresAt),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
