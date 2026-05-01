import { beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.clearAllMocks();
});

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "test",
    EMAIL_FROM: "test@example.com",
  },
  getEmailConfig: () => null,
  getGithubOAuthConfig: () => null,
  getGoogleOAuthConfig: () => null,
  getObjectStorageConfig: () => null,
  getRateLimitConfig: () => null,
}));
