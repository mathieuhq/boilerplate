import { describe, expect, it } from "vitest";

import {
  getEmailEnvConfig,
  getGithubOAuthEnvConfig,
  getGoogleOAuthEnvConfig,
  getObjectStorageEnvConfig,
  getRedisEnvConfig,
  validateEnvConfigGroups,
} from "../env-config";

describe("env config helpers", () => {
  it("treats empty optional values as absent", () => {
    expect(
      getEmailEnvConfig({
        EMAIL_API_KEY: "",
        EMAIL_API_BASE_URL: "",
        EMAIL_FROM: "",
        EMAIL_CONTACT_LIST_ID: "",
      }),
    ).toBeNull();
  });

  it("returns email config when required values are complete", () => {
    expect(
      getEmailEnvConfig({
        EMAIL_API_KEY: "email_key_123",
        EMAIL_API_BASE_URL: "https://plunk.example.com/api",
        EMAIL_FROM: "hello@example.com",
        EMAIL_CONTACT_LIST_ID: "contact-list-123",
      }),
    ).toEqual({
      apiKey: "email_key_123",
      baseUrl: "https://plunk.example.com/api",
      from: "hello@example.com",
      contactListId: "contact-list-123",
    });
  });

  it("uses the hosted Plunk API URL by default", () => {
    expect(
      getEmailEnvConfig({
        EMAIL_API_KEY: "email_key_123",
        EMAIL_FROM: "hello@example.com",
      }),
    ).toEqual({
      apiKey: "email_key_123",
      baseUrl: "https://next-api.useplunk.com",
      from: "hello@example.com",
    });
  });

  it("rejects incomplete email config", () => {
    expect(() =>
      getEmailEnvConfig({
        EMAIL_API_KEY: "email_key_123",
      }),
    ).toThrow("Email environment variables are incomplete");
  });

  it("requires all R2 values together", () => {
    expect(() =>
      getObjectStorageEnvConfig({
        R2_ACCOUNT_ID: "account",
        R2_BUCKET_NAME: "bucket",
      }),
    ).toThrow("Cloudflare R2 environment variables are incomplete");

    expect(
      getObjectStorageEnvConfig({
        R2_ACCOUNT_ID: "account",
        R2_ACCESS_KEY_ID: "access-key",
        R2_SECRET_ACCESS_KEY: "secret-key",
        R2_BUCKET_NAME: "bucket",
      }),
    ).toEqual({
      endpoint: "https://account.r2.cloudflarestorage.com",
      forcePathStyle: false,
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      bucketName: "bucket",
    });
  });

  it("uses R2_ENDPOINT with path-style URLs instead of the account endpoint", () => {
    expect(
      getObjectStorageEnvConfig({
        R2_ENDPOINT: "http://localhost:8333",
        R2_ACCESS_KEY_ID: "access-key",
        R2_SECRET_ACCESS_KEY: "secret-key",
        R2_BUCKET_NAME: "bucket",
      }),
    ).toEqual({
      endpoint: "http://localhost:8333",
      forcePathStyle: true,
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      bucketName: "bucket",
    });
  });

  it("requires R2_ACCOUNT_ID or R2_ENDPOINT", () => {
    expect(() =>
      getObjectStorageEnvConfig({
        R2_ACCESS_KEY_ID: "access-key",
        R2_SECRET_ACCESS_KEY: "secret-key",
        R2_BUCKET_NAME: "bucket",
      }),
    ).toThrow("Missing: R2_ACCOUNT_ID or R2_ENDPOINT");
  });

  it("reads Redis only when REDIS_URL is set", () => {
    expect(getRedisEnvConfig({ REDIS_URL: "" })).toBeNull();
    expect(
      getRedisEnvConfig({ REDIS_URL: "redis://:secret@localhost:6379" }),
    ).toEqual({ url: "redis://:secret@localhost:6379" });
  });

  it("accepts only complete OAuth provider pairs", () => {
    expect(
      getGithubOAuthEnvConfig({
        GITHUB_CLIENT_ID: "github-id",
        GITHUB_CLIENT_SECRET: "github-secret",
      }),
    ).toEqual({
      clientId: "github-id",
      clientSecret: "github-secret",
    });

    expect(() =>
      getGoogleOAuthEnvConfig({
        GOOGLE_CLIENT_ID: "google-id",
      }),
    ).toThrow("Google OAuth environment variables are incomplete");
  });

  it("validates every optional group", () => {
    expect(() =>
      validateEnvConfigGroups({
        EMAIL_FROM: "hello@example.com",
      }),
    ).toThrow("Email environment variables are incomplete");
  });
});
