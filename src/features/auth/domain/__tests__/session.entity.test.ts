import { describe, expect, it } from "vitest";

import { Session, type SessionProps } from "../entities/session.entity";

class TestSession extends Session {
  static create(props: SessionProps): TestSession {
    return new TestSession(props);
  }
}

describe("Session entity", () => {
  const baseProps: SessionProps = {
    id: "session-123",
    userId: "user-456",
    expiresAt: new Date("2030-01-01"),
  };

  describe("required properties", () => {
    it("should return id", () => {
      const session = TestSession.create(baseProps);
      expect(session.id).toBe("session-123");
    });

    it("should return userId", () => {
      const session = TestSession.create(baseProps);
      expect(session.userId).toBe("user-456");
    });

    it("should return expiresAt", () => {
      const session = TestSession.create(baseProps);
      expect(session.expiresAt).toEqual(new Date("2030-01-01"));
    });
  });

  describe("optional properties", () => {
    it("should return undefined for ipAddress when not set", () => {
      const session = TestSession.create(baseProps);
      expect(session.ipAddress).toBeUndefined();
    });

    it("should return ipAddress when set", () => {
      const session = TestSession.create({
        ...baseProps,
        ipAddress: "192.168.1.1",
      });
      expect(session.ipAddress).toBe("192.168.1.1");
    });

    it("should return undefined for userAgent when not set", () => {
      const session = TestSession.create(baseProps);
      expect(session.userAgent).toBeUndefined();
    });

    it("should return userAgent when set", () => {
      const session = TestSession.create({
        ...baseProps,
        userAgent: "Mozilla/5.0",
      });
      expect(session.userAgent).toBe("Mozilla/5.0");
    });
  });

  describe("isExpired", () => {
    it("should return false when session has not expired", () => {
      const session = TestSession.create({
        ...baseProps,
        expiresAt: new Date("2030-01-01"),
      });
      expect(session.isExpired).toBe(false);
    });

    it("should return true when session has expired", () => {
      const session = TestSession.create({
        ...baseProps,
        expiresAt: new Date("2020-01-01"),
      });
      expect(session.isExpired).toBe(true);
    });
  });

  describe("activity", () => {
    it("should use the last update as the last activity", () => {
      const session = Session.create({
        ...baseProps,
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-05"),
      });
      expect(session.lastActiveAt).toEqual(new Date("2026-01-05"));
    });

    it("should fall back to the creation date", () => {
      const session = Session.create({
        ...baseProps,
        createdAt: new Date("2026-01-01"),
      });
      expect(session.lastActiveAt).toEqual(new Date("2026-01-01"));
    });

    it("should return undefined without any date", () => {
      expect(Session.create(baseProps).lastActiveAt).toBeUndefined();
    });
  });

  describe("device", () => {
    it("should parse the user agent", () => {
      const session = Session.create({
        ...baseProps,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
      });
      expect(session.device.browser).toBe("Firefox");
      expect(session.device.os).toBe("Windows");
    });
  });

  describe("isImpersonation", () => {
    it("should be true when the session was opened by an admin", () => {
      const session = Session.create({
        ...baseProps,
        impersonatedBy: "admin-1",
      });
      expect(session.isImpersonation).toBe(true);
    });

    it("should be false otherwise", () => {
      expect(Session.create(baseProps).isImpersonation).toBe(false);
      expect(
        Session.create({ ...baseProps, impersonatedBy: null }).isImpersonation,
      ).toBe(false);
    });
  });
});
