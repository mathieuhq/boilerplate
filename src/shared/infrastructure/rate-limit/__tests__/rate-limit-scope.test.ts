import { describe, expect, it } from "vitest";

import { shouldRateLimitRequest } from "../rate-limit-scope";

describe("shouldRateLimitRequest", () => {
  it.each([
    ["/_serverFn/abc", "POST", "serverFn", true],
    ["/_serverFn/abc", "GET", "serverFn", false],
    ["/api/v1/public/me", "GET", "router", true],
    ["/api/v1/public/mcp", "POST", "router", true],
    ["/api/v1/private/admin/users/export", "GET", "router", true],
    ["/api/v1/public/health", "GET", "router", false],
    ["/api/v1/private/auth/sign-in/email", "POST", "router", false],
    ["/api/v1/private/admin/jobs/api/queues", "GET", "router", false],
    ["/settings/profile", "GET", "router", false],
    ["/assets/index.js", "GET", "router", false],
  ] as const)("%s %s (%s) -> %s", (pathname, method, handlerType, expected) => {
    expect(shouldRateLimitRequest(pathname, method, handlerType)).toBe(
      expected,
    );
  });
});
