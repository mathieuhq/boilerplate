import { describe, expect, it } from "vitest";

import { getClientRateLimitKey, resolveClientIp } from "../client-ip";

const spoofedHeaders = new Headers({
  "cf-connecting-ip": "203.0.113.10",
  "x-real-ip": "203.0.113.11",
  "x-forwarded-for": "203.0.113.12, 198.51.100.7",
});

describe("resolveClientIp", () => {
  it("should ignore every IP header when none is trusted", () => {
    expect(
      resolveClientIp(spoofedHeaders, { socketAddress: "192.0.2.1" }),
    ).toBe("192.0.2.1");
  });

  it("should read only the trusted header", () => {
    expect(
      resolveClientIp(spoofedHeaders, {
        trustedHeader: "x-real-ip",
        socketAddress: "192.0.2.1",
      }),
    ).toBe("203.0.113.11");
  });

  it("should take the entry appended by the proxy from x-forwarded-for", () => {
    expect(
      resolveClientIp(spoofedHeaders, { trustedHeader: "x-forwarded-for" }),
    ).toBe("198.51.100.7");
  });

  it("should not fall back to the socket when the trusted header is missing", () => {
    expect(
      resolveClientIp(new Headers(), {
        trustedHeader: "cf-connecting-ip",
        socketAddress: "192.0.2.1",
      }),
    ).toBeNull();
  });

  it("should reject values that are not IP addresses", () => {
    const headers = new Headers({ "x-real-ip": "beef" });

    expect(resolveClientIp(headers, { trustedHeader: "x-real-ip" })).toBeNull();
    expect(resolveClientIp(new Headers(), { socketAddress: "abc" })).toBeNull();
  });

  it("should unwrap IPv4-mapped IPv6 socket addresses", () => {
    expect(
      resolveClientIp(new Headers(), { socketAddress: "::ffff:192.0.2.1" }),
    ).toBe("192.0.2.1");
  });

  it("should normalize IPv6 addresses to lowercase", () => {
    expect(
      resolveClientIp(new Headers(), { socketAddress: "2001:DB8::1" }),
    ).toBe("2001:db8::1");
  });
});

describe("getClientRateLimitKey", () => {
  it("should use IPv4 addresses as is", () => {
    expect(getClientRateLimitKey("192.0.2.1")).toBe("192.0.2.1");
  });

  it("should group IPv6 addresses by /64", () => {
    expect(getClientRateLimitKey("2001:db8:1:2:aaaa::1")).toBe(
      "2001:0db8:0001:0002::/64",
    );
    expect(getClientRateLimitKey("2001:db8:1:2:bbbb::2")).toBe(
      "2001:0db8:0001:0002::/64",
    );
  });

  it("should share a single bucket when the IP is unknown", () => {
    expect(getClientRateLimitKey(null)).toBe("unknown");
  });
});
