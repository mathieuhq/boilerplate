import { describe, expect, it } from "vitest";

import {
  createCspNonce,
  getSecurityHeaders,
  isRequestBodyTooLarge,
  MAX_REQUEST_BODY_BYTES,
} from "../security-headers";

function requestWithLength(length?: number) {
  return new Request("http://localhost/_serverFn/abc", {
    method: "POST",
    headers:
      length === undefined ? {} : { "content-length": length.toString() },
  });
}

describe("isRequestBodyTooLarge", () => {
  it("leaves room for a 10 MB upload", () => {
    expect(MAX_REQUEST_BODY_BYTES).toBeGreaterThan(10 * 1024 * 1024);
  });

  it.each([
    [undefined, false],
    [0, false],
    [MAX_REQUEST_BODY_BYTES, false],
    [MAX_REQUEST_BODY_BYTES + 1, true],
    [1024 * 1024 * 1024, true],
  ])("content-length %s -> %s", (length, expected) => {
    expect(isRequestBodyTooLarge(requestWithLength(length))).toBe(expected);
  });
});

describe("createCspNonce", () => {
  it("returns a fresh base64 nonce of 16 bytes", () => {
    const nonce = createCspNonce();

    expect(Buffer.from(nonce, "base64")).toHaveLength(16);
    expect(createCspNonce()).not.toBe(nonce);
  });
});

describe("getSecurityHeaders", () => {
  it("allows scripts by nonce only", () => {
    const csp = getSecurityHeaders("abc", true)["Content-Security-Policy"];

    expect(csp).toContain("script-src 'self' 'nonce-abc'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("sends HSTS and upgrades requests in production", () => {
    const headers = getSecurityHeaders("abc", true);

    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=31536000; includeSubDomains",
    );
    expect(headers["Content-Security-Policy"]).toContain(
      "upgrade-insecure-requests",
    );
  });

  it("keeps the other headers outside production", () => {
    const headers = getSecurityHeaders("abc", false);

    expect(headers["Strict-Transport-Security"]).toBeUndefined();
    expect(headers["Content-Security-Policy"]).not.toContain(
      "upgrade-insecure-requests",
    );
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });
});
