import { describe, expect, it } from "vitest";

import { DomainError } from "@/shared/domain/errors/domain.error";

import { ContentType } from "../value-objects/content-type.value-object";

describe("ContentType Value Object", () => {
  describe("create", () => {
    it("should create valid content type for image/jpeg", () => {
      const contentType = ContentType.create("image/jpeg");
      expect(contentType.value).toBe("image/jpeg");
    });

    it("should create valid content type for image/png", () => {
      const contentType = ContentType.create("image/png");
      expect(contentType.value).toBe("image/png");
    });

    it("should create valid content type for image/gif", () => {
      const contentType = ContentType.create("image/gif");
      expect(contentType.value).toBe("image/gif");
    });

    it("should create valid content type for image/webp", () => {
      const contentType = ContentType.create("image/webp");
      expect(contentType.value).toBe("image/webp");
    });

    it("should normalize content type to lowercase", () => {
      const contentType = ContentType.create("IMAGE/JPEG");
      expect(contentType.value).toBe("image/jpeg");
    });

    it("should trim whitespace from content type", () => {
      const contentType = ContentType.create("  image/png  ");
      expect(contentType.value).toBe("image/png");
    });

    it("should throw error for empty content type", () => {
      expect(() => ContentType.create("")).toThrow(DomainError);
      expect(() => ContentType.create("")).toThrow(
        "Content type cannot be empty",
      );
    });

    it("should throw error for whitespace-only content type", () => {
      expect(() => ContentType.create("   ")).toThrow(DomainError);
    });

    it("should throw error for unsupported content type", () => {
      expect(() => ContentType.create("application/pdf")).toThrow(DomainError);
      expect(() => ContentType.create("application/pdf")).toThrow(
        "Invalid content type. Allowed types:",
      );
    });

    it("should throw error for svg content type", () => {
      expect(() => ContentType.create("image/svg+xml")).toThrow(DomainError);
    });

    it("should throw error for video content type", () => {
      expect(() => ContentType.create("video/mp4")).toThrow(DomainError);
    });

    it("should throw error for text content type", () => {
      expect(() => ContentType.create("text/plain")).toThrow(DomainError);
    });
  });

  describe("getAllowedTypes", () => {
    it("should return all allowed image types", () => {
      const allowedTypes = ContentType.getAllowedTypes();

      expect(allowedTypes).toContain("image/jpeg");
      expect(allowedTypes).toContain("image/png");
      expect(allowedTypes).toContain("image/gif");
      expect(allowedTypes).toContain("image/webp");
      expect(allowedTypes).not.toContain("image/svg+xml");
      expect(allowedTypes).toHaveLength(4);
    });
  });

  describe("equals", () => {
    it("should return true for equal content types", () => {
      const type1 = ContentType.create("image/png");
      const type2 = ContentType.create("image/png");

      expect(type1.equals(type2)).toBe(true);
    });

    it("should return false for different content types", () => {
      const type1 = ContentType.create("image/png");
      const type2 = ContentType.create("image/jpeg");

      expect(type1.equals(type2)).toBe(false);
    });

    it("should return true when comparing normalized values", () => {
      const type1 = ContentType.create("IMAGE/PNG");
      const type2 = ContentType.create("image/png");

      expect(type1.equals(type2)).toBe(true);
    });
  });
});
