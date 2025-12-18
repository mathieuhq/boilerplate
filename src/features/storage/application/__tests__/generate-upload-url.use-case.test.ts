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
    };

    useCase = new GenerateUploadUrlUseCase(mockObjectStorage);
  });

  it("should generate upload url successfully", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid");
    vi.spyOn(Date, "now").mockReturnValue(1704067200000);

    const result = await useCase.execute({
      fileName: "test.png",
      contentType: "image/png",
      fileSize: 1024,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.uploadUrl).toBe("https://r2.example.com/presigned-url");
    expect(result.value.key).toBe("uploads/1704067200000-test-uuid-test.png");
    expect(result.value.expiresAt).toBeInstanceOf(Date);

    expect(mockObjectStorage.generateUploadUrl).toHaveBeenCalledWith({
      key: "uploads/1704067200000-test-uuid-test.png",
      contentType: "image/png",
      expiresInSeconds: 3600,
    });

    vi.restoreAllMocks();
  });

  it("should use custom prefix when provided", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid");
    vi.spyOn(Date, "now").mockReturnValue(0);

    const result = await useCase.execute({
      fileName: "avatar.jpg",
      contentType: "image/jpeg",
      fileSize: 2048,
      prefix: "avatars",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.key).toBe("avatars/0-uuid-avatar.jpg");

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
    vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid");
    vi.spyOn(Date, "now").mockReturnValue(0);

    const result = await useCase.execute({
      fileName: "exact.png",
      contentType: "image/png",
      fileSize: 10 * 1024 * 1024,
    });

    expect(result.isSuccess).toBe(true);

    vi.restoreAllMocks();
  });
});
