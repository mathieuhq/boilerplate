import { describe, expect, it } from "vitest";

import { DomainError } from "@/shared/domain/errors/domain.error";

import { Email } from "../value-objects/email.value-object";

describe("Email Value Object", () => {
  describe("create", () => {
    it("should create a valid email", () => {
      const email = Email.create("test@example.com");
      expect(email.value).toBe("test@example.com");
    });

    it("should lowercase the email", () => {
      const email = Email.create("TEST@EXAMPLE.COM");
      expect(email.value).toBe("test@example.com");
    });

    it("should accept email with subdomain", () => {
      const email = Email.create("user@mail.example.com");
      expect(email.value).toBe("user@mail.example.com");
    });

    it("should accept email with plus sign", () => {
      const email = Email.create("user+tag@example.com");
      expect(email.value).toBe("user+tag@example.com");
    });
  });

  describe("validation errors", () => {
    it("should throw DomainError for invalid email format", () => {
      expect(() => Email.create("invalid-email")).toThrow(DomainError);
      expect(() => Email.create("invalid-email")).toThrow(
        "Invalid email format",
      );
    });

    it("should throw DomainError for email without domain", () => {
      expect(() => Email.create("test@")).toThrow(DomainError);
    });

    it("should throw DomainError for email without local part", () => {
      expect(() => Email.create("@example.com")).toThrow(DomainError);
    });

    it("should throw DomainError for empty email", () => {
      expect(() => Email.create("")).toThrow(DomainError);
    });

    it("should throw DomainError for null/undefined", () => {
      expect(() => Email.create(null as unknown as string)).toThrow(
        DomainError,
      );
      expect(() => Email.create(undefined as unknown as string)).toThrow(
        DomainError,
      );
    });

    it("should throw DomainError for email with spaces", () => {
      expect(() => Email.create("test @example.com")).toThrow(DomainError);
    });
  });

  describe("equals", () => {
    it("should return true for same email values", () => {
      const email1 = Email.create("test@example.com");
      const email2 = Email.create("test@example.com");
      expect(email1.equals(email2)).toBe(true);
    });

    it("should return true for same email with different case", () => {
      const email1 = Email.create("TEST@example.com");
      const email2 = Email.create("test@EXAMPLE.com");
      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for different email values", () => {
      const email1 = Email.create("test1@example.com");
      const email2 = Email.create("test2@example.com");
      expect(email1.equals(email2)).toBe(false);
    });
  });
});
