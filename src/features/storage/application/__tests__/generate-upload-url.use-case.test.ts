import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IObjectStoragePort } from "../ports/object-storage.port";
import { GenerateUploadUrlUseCase } from "../use-cases/generate-upload-url.use-case";

describe("GenerateUploadUrlUseCase", () => {
  let useCase: GenerateUploadUrlUseCase;
  let mockObjectStorage: IObjectStoragePort;

  beforeEach(() => {
    mockObjectStorage = {
      generateUploadUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.com/presigned-url"),
      generateDownloadUrl: vi.fn(),
      deleteObject: vi.fn(),
      getObjectMetadata: vi.fn(),
      uploadObject: vi.fn(),
    };

    useCase = new GenerateUploadUrlUseCase(mockObjectStorage);
  });

  it("should generate upload url successfully with random key", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "123e4567-e89b-12d3-a456-426614174000",
    );

    const result = await useCase.execute({
      fileName: "test.png",
      contentType: "image/png",
      fileSize: 1024,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.uploadUrl).toBe("https://r2.example.com/presigned-url");
    expect(result.value.key).toBe(
      "uploads/123e4567-e89b-12d3-a456-426614174000.png",
    );
    expect(result.value.expiresAt).toBeInstanceOf(Date);

    expect(mockObjectStorage.generateUploadUrl).toHaveBeenCalledWith({
      key: "uploads/123e4567-e89b-12d3-a456-426614174000.png",
      contentType: "image/png",
      expiresInSeconds: 3600,
    });

    vi.restoreAllMocks();
  });

  it("should use custom prefix when provided", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "123e4567-e89b-12d3-a456-426614174001",
    );

    const result = await useCase.execute({
      fileName: "avatar.jpg",
      contentType: "image/jpeg",
      fileSize: 2048,
      prefix: "user-avatars",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.key).toBe(
      "user-avatars/123e4567-e89b-12d3-a456-426614174001.jpg",
    );

    vi.restoreAllMocks();
  });

  it("should fail when file size exceeds 10MB", async () => {
    const result = await useCase.execute({
      fileName: "large.png",
      contentType: "image/png",
      fileSize: 11 * 1024 * 1024,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toContain("exceeds maximum allowed size");
  });

  it("should fail for invalid content type", async () => {
    const result = await useCase.execute({
      fileName: "document.pdf",
      contentType: "application/pdf",
      fileSize: 1024,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toContain("Invalid content type");
  });

  it("should fail when object storage throws error", async () => {
    mockObjectStorage.generateUploadUrl = vi
      .fn()
      .mockRejectedValue(new Error("Storage error"));

    const result = await useCase.execute({
      fileName: "test.png",
      contentType: "image/png",
      fileSize: 1024,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("Storage error");
  });

  it("should accept file at exactly 10MB", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "123e4567-e89b-12d3-a456-426614174001",
    );

    const result = await useCase.execute({
      fileName: "exact.png",
      contentType: "image/png",
      fileSize: 10 * 1024 * 1024,
    });

    expect(result.isSuccess).toBe(true);

    vi.restoreAllMocks();
  });

  it("should wrap non-Error thrown values in Error", async () => {
    mockObjectStorage.generateUploadUrl = vi
      .fn()
      .mockRejectedValue("string error");

    const result = await useCase.execute({
      fileName: "test.png",
      contentType: "image/png",
      fileSize: 1024,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("string error");
  });

  it("should fail for svg content type", async () => {
    const result = await useCase.execute({
      fileName: "icon.svg",
      contentType: "image/svg+xml",
      fileSize: 1024,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toContain("Invalid content type");
  });

  it("should fail for unmanaged prefixes", async () => {
    const result = await useCase.execute({
      fileName: "test.png",
      contentType: "image/png",
      fileSize: 1024,
      prefix: "documents",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe(
      "File key prefix is not managed by this app",
    );
  });
});
