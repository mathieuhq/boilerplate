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
});
