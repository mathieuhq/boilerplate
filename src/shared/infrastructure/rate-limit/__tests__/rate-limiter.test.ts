import { describe, expect, it, vi } from "vitest";

import { HttpError } from "@/shared/domain/errors/http.error";

import { createRateLimiter, type RateLimitStore } from "../rate-limiter";

const createStore = (reply: number) => {
  const evalScript = vi.fn<RateLimitStore["eval"]>().mockResolvedValue(reply);

  return { store: { eval: evalScript } satisfies RateLimitStore, evalScript };
};

describe("createRateLimiter", () => {
  it("allows all requests without Redis outside production", async () => {
    const rateLimiter = createRateLimiter({ NODE_ENV: "development" }, null);

    await expect(rateLimiter.limit("127.0.0.1")).resolves.toEqual({
      success: true,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
    });
  });

  it("allows all requests with Redis outside production", async () => {
    const { store, evalScript } = createStore(-1);
    const rateLimiter = createRateLimiter({ NODE_ENV: "development" }, store);

    await expect(rateLimiter.limit("127.0.0.1")).resolves.toEqual({
      success: true,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
    });
    expect(evalScript).not.toHaveBeenCalled();
  });

  it("throws an explicit error without Redis in production", async () => {
    const rateLimiter = createRateLimiter({ NODE_ENV: "production" }, null);

    await expect(rateLimiter.limit("127.0.0.1")).rejects.toMatchObject({
      code: "REDIS_NOT_CONFIGURED",
    });
    await expect(rateLimiter.limit("127.0.0.1")).rejects.toBeInstanceOf(
      HttpError,
    );
  });

  it("counts the request in the current and previous windows", async () => {
    const { store, evalScript } = createStore(99);
    const rateLimiter = createRateLimiter(
      { NODE_ENV: "production" },
      store,
      () => 120_000 + 15_000,
    );

    await expect(rateLimiter.limit("127.0.0.1")).resolves.toEqual({
      success: true,
      limit: 100,
      remaining: 99,
    });
    expect(evalScript).toHaveBeenCalledWith(
      expect.any(String),
      2,
      "@boilerplate/ratelimit:127.0.0.1:2",
      "@boilerplate/ratelimit:127.0.0.1:1",
      100,
      0.25,
      60_000,
    );
  });

  it("rejects the request once the limit is reached", async () => {
    const { store } = createStore(-1);
    const rateLimiter = createRateLimiter({ NODE_ENV: "production" }, store);

    await expect(rateLimiter.limit("127.0.0.1")).resolves.toEqual({
      success: false,
      limit: 100,
      remaining: 0,
    });
  });
});
