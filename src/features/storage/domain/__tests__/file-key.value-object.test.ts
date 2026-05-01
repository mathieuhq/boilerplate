import { describe, expect, it, vi } from "vitest";

import { DomainError } from "@/shared/domain/errors/domain.error";

import { FileKey } from "../value-objects/file-key.value-object";

describe("FileKey Value Object", () => {
  describe("create", () => {
    it("should create a valid file key", () => {
      const fileKey = FileKey.create("uploads/test-file.png");
      expect(fileKey.value).toBe("uploads/test-file.png");
    });

    it("should throw error for empty key", () => {
      expect(() => FileKey.create("")).toThrow(DomainError);
      expect(() => FileKey.create("")).toThrow("File key cannot be empty");
    });

    it("should throw error for whitespace-only key", () => {
      expect(() => FileKey.create("   ")).toThrow(DomainError);
      expect(() => FileKey.create("   ")).toThrow("File key cannot be empty");
    });

    it("should throw error for key exceeding max length", () => {
      const longKey = "a".repeat(1025);
      expect(() => FileKey.create(longKey)).toThrow(DomainError);
      expect(() => FileKey.create(longKey)).toThrow(
        "File key cannot exceed 1024 characters",
      );
    });

    it("should accept key at max length", () => {
      const maxKey = "a".repeat(1024);
      const fileKey = FileKey.create(maxKey);
      expect(fileKey.value).toBe(maxKey);
    });
  });

  describe("generate", () => {
    it("should generate a unique file key with prefix and extension", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(
        "123e4567-e89b-12d3-a456-426614174000",
      );

      const fileKey = FileKey.generate("user-avatars", "webp");

      expect(fileKey.value).toBe(
        "user-avatars/123e4567-e89b-12d3-a456-426614174000.webp",
      );

      vi.restoreAllMocks();
    });

    it("should generate random key without original filename", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid");

      const fileKey = FileKey.generate("uploads", "jpg");

      expect(fileKey.value).toBe("uploads/test-uuid.jpg");
      expect(fileKey.value).not.toContain("original");

      vi.restoreAllMocks();
    });

    it("should work with different extensions", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid");

      const fileKey = FileKey.generate("docs", "png");

      expect(fileKey.value).toBe("docs/uuid.png");

      vi.restoreAllMocks();
    });
  });

  describe("equals", () => {
    it("should return true for equal file keys", () => {
      const key1 = FileKey.create("uploads/test.png");
      const key2 = FileKey.create("uploads/test.png");

      expect(key1.equals(key2)).toBe(true);
    });

    it("should return false for different file keys", () => {
      const key1 = FileKey.create("uploads/test1.png");
      const key2 = FileKey.create("uploads/test2.png");

      expect(key1.equals(key2)).toBe(false);
    });
  });
});
