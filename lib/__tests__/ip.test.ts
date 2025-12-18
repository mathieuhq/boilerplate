import type { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { getIp } from "../ip";

function createMockRequest(
  headers: Record<string, string>,
  options: { ip?: string; url?: string } = {},
): NextRequest {
  const headerMap = new Map(Object.entries(headers));
  return {
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
    ip: options.ip,
    url: options.url ?? "https://example.com/test",
  } as unknown as NextRequest;
}

describe("getIp", () => {
  describe("header priority", () => {
    it("should prioritize CF-Connecting-IP over other headers", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
        "x-forwarded-for": "3.3.3.3",
      });

      expect(getIp(request)).toBe("1.1.1.1");
    });

    it("should use X-Real-IP when CF-Connecting-IP is not present", () => {
      const request = createMockRequest({
        "x-real-ip": "2.2.2.2",
        "x-forwarded-for": "3.3.3.3",
      });

      expect(getIp(request)).toBe("2.2.2.2");
    });

    it("should use X-Forwarded-For when other headers are not present", () => {
      const request = createMockRequest({
        "x-forwarded-for": "3.3.3.3",
      });

      expect(getIp(request)).toBe("3.3.3.3");
    });

    it("should use request.ip when no proxy headers are present", () => {
      const request = createMockRequest({}, { ip: "4.4.4.4" });

      expect(getIp(request)).toBe("4.4.4.4");
    });
  });

  describe("X-Forwarded-For parsing", () => {
    it("should extract first IP from X-Forwarded-For chain", () => {
      const request = createMockRequest({
        "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
      });

      expect(getIp(request)).toBe("203.0.113.195");
    });

    it("should skip invalid IPs and use first valid one", () => {
      const request = createMockRequest({
        "x-forwarded-for": "invalid, malformed, 203.0.113.195, 70.41.3.18",
      });

      expect(getIp(request)).toBe("203.0.113.195");
    });

    it("should handle whitespace in X-Forwarded-For", () => {
      const request = createMockRequest({
        "x-forwarded-for": "  203.0.113.195  ,  70.41.3.18  ",
      });

      expect(getIp(request)).toBe("203.0.113.195");
    });
  });

  describe("IP validation", () => {
    it("should reject invalid CF-Connecting-IP and try next header", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "not-an-ip",
        "x-real-ip": "2.2.2.2",
      });

      expect(getIp(request)).toBe("2.2.2.2");
    });

    it("should reject script injection attempts", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "<script>alert(1)</script>",
        "x-forwarded-for": "'; DROP TABLE users;--",
      });

      expect(getIp(request)).toMatch(/^anonymous-/);
    });

    it("should accept valid IPv4 addresses", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "192.168.1.1",
      });

      expect(getIp(request)).toBe("192.168.1.1");
    });

    it("should accept valid IPv6 addresses", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      });

      expect(getIp(request)).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });

    it("should accept compressed IPv6 addresses", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "::1",
      });

      expect(getIp(request)).toBe("::1");
    });
  });

  describe("fallback behavior", () => {
    it("should generate unique anonymous ID when no valid IP found", () => {
      const request1 = createMockRequest(
        {},
        { url: "https://example.com/page1" },
      );
      const request2 = createMockRequest(
        {},
        { url: "https://example.com/page2" },
      );

      const ip1 = getIp(request1);
      const ip2 = getIp(request2);

      expect(ip1).toMatch(/^anonymous-/);
      expect(ip2).toMatch(/^anonymous-/);
      expect(ip1).not.toBe(ip2);
    });

    it("should generate consistent ID for same URL", () => {
      const request1 = createMockRequest(
        {},
        { url: "https://example.com/same" },
      );
      const request2 = createMockRequest(
        {},
        { url: "https://example.com/same" },
      );

      expect(getIp(request1)).toBe(getIp(request2));
    });
  });

  describe("edge cases", () => {
    it("should trim whitespace from IPs", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "  1.1.1.1  ",
      });

      expect(getIp(request)).toBe("1.1.1.1");
    });

    it("should handle empty string headers", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "",
        "x-real-ip": "",
        "x-forwarded-for": "",
      });

      expect(getIp(request)).toMatch(/^anonymous-/);
    });

    it("should handle boundary IPv4 values", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "255.255.255.255",
      });

      expect(getIp(request)).toBe("255.255.255.255");
    });

    it("should reject IPv4 with out-of-range octets", () => {
      const request = createMockRequest({
        "cf-connecting-ip": "256.1.1.1",
        "x-real-ip": "1.1.1.1",
      });

      expect(getIp(request)).toBe("1.1.1.1");
    });
  });
});
