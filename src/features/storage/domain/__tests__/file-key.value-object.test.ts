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
    it("should generate a unique file key with prefix and sanitized filename", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(
        "123e4567-e89b-12d3-a456-426614174000",
      );
      vi.spyOn(Date, "now").mockReturnValue(1704067200000);

      const fileKey = FileKey.generate("avatars", "my file.png");

      expect(fileKey.value).toBe(
        "avatars/1704067200000-123e4567-e89b-12d3-a456-426614174000-my_file.png",
      );

      vi.restoreAllMocks();
    });

    it("should sanitize special characters in filename", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid");
      vi.spyOn(Date, "now").mockReturnValue(1000);

      const fileKey = FileKey.generate("uploads", "file@#$%^&*().jpg");

      expect(fileKey.value).toBe("uploads/1000-test-uuid-file_________.jpg");

      vi.restoreAllMocks();
    });

    it("should preserve valid filename characters", () => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid");
      vi.spyOn(Date, "now").mockReturnValue(0);

      const fileKey = FileKey.generate("docs", "valid-file_name.test.pdf");

      expect(fileKey.value).toBe("docs/0-uuid-valid-file_name.test.pdf");

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
