import { z } from "zod";

import {
  getEmailEnvConfig,
  getGithubOAuthEnvConfig,
  getGoogleOAuthEnvConfig,
  getObjectStorageEnvConfig,
  getRedisEnvConfig,
  validateEnvConfigGroups,
} from "@/shared/infrastructure/env/env-config";
import { TRUSTED_IP_HEADERS } from "@/shared/infrastructure/http/client-ip";
import { createEnv } from "@t3-oss/env-core";

const parseEmailList = (value?: string) =>
  value
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean) ?? [];

const parseUrlList = (value?: string) =>
  value
    ?.split(",")
    .map((url) => url.trim())
    .filter(Boolean) ?? [];

const commaSeparatedEmailsSchema = z.string().refine((value) => {
  const emails = parseEmailList(value);

  return (
    emails.length > 0 &&
    emails.every((email) => z.email().safeParse(email).success)
  );
}, "Expected a comma-separated list of email addresses");

const commaSeparatedUrlsSchema = z.string().refine((value) => {
  const urls = parseUrlList(value);

  return urls.length > 0 && urls.every((url) => z.url().safeParse(url).success);
}, "Expected a comma-separated list of URLs");

const insecureBetterAuthSecrets = new Set([
  "ceU7Bu8lj01Y71QuGpTPQNDbOc9jjNXc",
  "generate-a-strong-secret-with-openssl-rand-base64-32",
]);

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    DATABASE_URL: z.url(),

    BETTER_AUTH_URL: z.url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_ADMIN_EMAIL: commaSeparatedEmailsSchema.optional(),
    BETTER_AUTH_TRUSTED_ORIGINS: commaSeparatedUrlsSchema.optional(),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    EMAIL_FROM: z.email().optional(),
    EMAIL_API_KEY: z.string().min(1).optional(),
    EMAIL_CONTACT_LIST_ID: z.string().min(1).optional(),

    REDIS_URL: z.url().optional(),

    TRUSTED_IP_HEADER: z.enum(TRUSTED_IP_HEADERS).optional(),

    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ENDPOINT: z.url().optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),

    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRO_PRICE_ID: z.string().min(1),
    STRIPE_TEAM_PRICE_ID: z.string().min(1),
    STRIPE_TEAM_SEAT_PRICE_ID: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

if (typeof window === "undefined") validateEnvConfigGroups(process.env);

if (
  typeof window === "undefined" &&
  env.NODE_ENV === "production" &&
  insecureBetterAuthSecrets.has(env.BETTER_AUTH_SECRET)
) {
  throw new Error("BETTER_AUTH_SECRET must be unique and random in production");
}

export function getEmailConfig() {
  return getEmailEnvConfig(process.env);
}

export function getObjectStorageConfig() {
  return getObjectStorageEnvConfig(process.env);
}

export function getRedisConfig() {
  return getRedisEnvConfig(process.env);
}

export function getGithubOAuthConfig() {
  return getGithubOAuthEnvConfig(process.env);
}

export function getGoogleOAuthConfig() {
  return getGoogleOAuthEnvConfig(process.env);
}

export function getStripeConfig() {
  return {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    proPriceId: env.STRIPE_PRO_PRICE_ID,
    teamPriceId: env.STRIPE_TEAM_PRICE_ID,
    teamSeatPriceId: env.STRIPE_TEAM_SEAT_PRICE_ID,
  };
}

export function getBootstrapAdminEmails() {
  return new Set(parseEmailList(env.BETTER_AUTH_ADMIN_EMAIL));
}

export function getTrustedOrigins() {
  return parseUrlList(env.BETTER_AUTH_TRUSTED_ORIGINS);
}
