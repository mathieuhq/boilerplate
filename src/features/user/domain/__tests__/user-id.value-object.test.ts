import { describe, expect, it } from "vitest";

import { DomainError } from "@/shared/domain/errors/domain.error";

import { UserId } from "../value-objects/user-id.value-object";

describe("UserId Value Object", () => {
  describe("create", () => {
    it("should create a valid user id", () => {
      const userId = UserId.create("user-123");
      expect(userId.value).toBe("user-123");
    });

    it("should create user id with uuid format", () => {
      const userId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
      expect(userId.value).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should create user id with numeric string", () => {
      const userId = UserId.create("12345");
      expect(userId.value).toBe("12345");
    });
  });

  describe("validation errors", () => {
    it("should throw DomainError for empty string", () => {
      expect(() => UserId.create("")).toThrow(DomainError);
      expect(() => UserId.create("")).toThrow("User ID cannot be empty");
    });

    it("should throw DomainError for whitespace only", () => {
      expect(() => UserId.create("   ")).toThrow(DomainError);
      expect(() => UserId.create("   ")).toThrow("User ID cannot be empty");
    });

    it("should throw DomainError for null/undefined", () => {
      expect(() => UserId.create(null as unknown as string)).toThrow(
        DomainError,
      );
      expect(() => UserId.create(undefined as unknown as string)).toThrow(
        DomainError,
      );
    });
  });

  describe("equals", () => {
    it("should return true for same id values", () => {
      const id1 = UserId.create("user-123");
      const id2 = UserId.create("user-123");
      expect(id1.equals(id2)).toBe(true);
    });

    it("should return false for different id values", () => {
      const id1 = UserId.create("user-123");
      const id2 = UserId.create("user-456");
      expect(id1.equals(id2)).toBe(false);
    });
  });
});
