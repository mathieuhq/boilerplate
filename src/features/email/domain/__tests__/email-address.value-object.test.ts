import { describe, expect, it } from "vitest";

import { DomainError } from "@/shared/domain/errors/domain.error";

import { EmailAddress } from "../value-objects/email-address.value-object";

describe("EmailAddress value object", () => {
  describe("create", () => {
    it("should create email address with valid email", () => {
      const email = EmailAddress.create("test@example.com");
      expect(email.value).toBe("test@example.com");
    });

    it("should normalize email to lowercase", () => {
      const email = EmailAddress.create("Test@EXAMPLE.COM");
      expect(email.value).toBe("test@example.com");
    });

    it("should throw DomainError for empty email", () => {
      expect(() => EmailAddress.create("")).toThrow(DomainError);
      expect(() => EmailAddress.create("")).toThrow(
        "Invalid email address format",
      );
    });

    it("should throw DomainError for invalid email format", () => {
      expect(() => EmailAddress.create("invalid")).toThrow(DomainError);
      expect(() => EmailAddress.create("invalid@")).toThrow(DomainError);
      expect(() => EmailAddress.create("@example.com")).toThrow(DomainError);
      expect(() => EmailAddress.create("test@.com")).toThrow(DomainError);
    });

    it("should throw DomainError for email with spaces", () => {
      expect(() => EmailAddress.create("test @example.com")).toThrow(
        DomainError,
      );
      expect(() => EmailAddress.create("test@ example.com")).toThrow(
        DomainError,
      );
    });
  });

  describe("equals", () => {
    it("should return true for equal email addresses", () => {
      const email1 = EmailAddress.create("test@example.com");
      const email2 = EmailAddress.create("test@example.com");
      expect(email1.equals(email2)).toBe(true);
    });

    it("should return true for same email with different case", () => {
      const email1 = EmailAddress.create("test@example.com");
      const email2 = EmailAddress.create("TEST@EXAMPLE.COM");
      expect(email1.equals(email2)).toBe(true);
    });

    it("should return false for different email addresses", () => {
      const email1 = EmailAddress.create("test1@example.com");
      const email2 = EmailAddress.create("test2@example.com");
      expect(email1.equals(email2)).toBe(false);
    });
  });

  describe("value getter", () => {
    it("should return the email value", () => {
      const email = EmailAddress.create("user@domain.org");
      expect(email.value).toBe("user@domain.org");
    });
  });
});
