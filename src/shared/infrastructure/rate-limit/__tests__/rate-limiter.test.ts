import { describe, expect, it } from "vitest";

import { HttpError } from "@/shared/domain/errors/http.error";

import { createRateLimiter } from "../rate-limiter";

describe("createRateLimiter", () => {
  it("allows all requests without Upstash outside production", async () => {
    const rateLimiter = createRateLimiter({ NODE_ENV: "development" });

    await expect(rateLimiter.limit("127.0.0.1")).resolves.toEqual({
      success: true,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
    });
  });

  it("throws an explicit error without Upstash in production", async () => {
    const rateLimiter = createRateLimiter({ NODE_ENV: "production" });

    await expect(rateLimiter.limit("127.0.0.1")).rejects.toMatchObject({
      code: "UPSTASH_REDIS_NOT_CONFIGURED",
    });
    await expect(rateLimiter.limit("127.0.0.1")).rejects.toBeInstanceOf(
      HttpError,
    );
  });
});
