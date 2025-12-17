import { describe, expect, it } from "vitest";

import { Email } from "@/features/user/domain/value-objects/email.value-object";
import { UserId } from "@/features/user/domain/value-objects/user-id.value-object";

describe("ValueObject base", () => {
  describe("immutability", () => {
    it("should be immutable - same value creates equal objects", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("test@example.com");
      expect(email1.equals(email2)).toBe(true);
      expect(email1.value).toBe(email2.value);
    });
  });

  describe("equals", () => {
    it("should return true for equal value objects", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("test@example.com");
      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for different value objects", () => {
      const email1 = Email.create("test1@example.com");
      const email2 = Email.create("test2@example.com");
      expect(email1.equals(email2)).toBe(false);
    });

    it("should work for UserId value objects", () => {
      const id1 = UserId.create("user-123");
      const id2 = UserId.create("user-123");
      expect(id1.equals(id2)).toBe(true);
    });
  });
});
