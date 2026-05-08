import { z } from "zod";

import {
  getEmailEnvConfig,
  getGithubOAuthEnvConfig,
  getGoogleOAuthEnvConfig,
  getObjectStorageEnvConfig,
  validateEnvConfigGroups,
} from "@/shared/infrastructure/env/env-config";
import { createEnv } from "@t3-oss/env-core";

const parseEmailList = (value?: string) =>
  value
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean) ?? [];

const commaSeparatedEmailsSchema = z.string().refine((value) => {
  const emails = parseEmailList(value);

  return (
    emails.length > 0 &&
    emails.every((email) => z.email().safeParse(email).success)
  );
}, "Expected a comma-separated list of email addresses");

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    DATABASE_URL: z.url(),

    BETTER_AUTH_URL: z.url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_ADMIN_EMAIL: commaSeparatedEmailsSchema.optional(),

    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    EMAIL_FROM: z.email().optional(),
    EMAIL_API_BASE_URL: z.url().optional(),
    EMAIL_API_KEY: z.string().min(1).optional(),
    EMAIL_CONTACT_LIST_ID: z.string().min(1).optional(),

    GLITCHTIP_URL: z.url().optional(),
    GLITCHTIP_ORG: z.string().min(1).optional(),
    GLITCHTIP_PROJECT: z.string().min(1).optional(),
    GLITCHTIP_AUTH_TOKEN: z.string().min(1).optional(),

    ZENVOICE_URL: z.url().optional(),

    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
  },
  client: {
    VITE_GLITCHTIP_DSN: z.url().optional(),
    VITE_UMAMI_URL: z.string().optional(),
    VITE_UMAMI_WEBSITE_ID: z.string().optional(),
  },
  clientPrefix: "VITE_",
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

if (typeof window === "undefined") validateEnvConfigGroups(process.env);

export function getEmailConfig() {
  return getEmailEnvConfig(process.env);
}

export function getObjectStorageConfig() {
  return getObjectStorageEnvConfig(process.env);
}

export function getGithubOAuthConfig() {
  return getGithubOAuthEnvConfig(process.env);
}

export function getGoogleOAuthConfig() {
  return getGoogleOAuthEnvConfig(process.env);
}

export function getBootstrapAdminEmails() {
  return new Set(parseEmailList(env.BETTER_AUTH_ADMIN_EMAIL));
}
