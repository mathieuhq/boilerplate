import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IObjectStoragePort } from "../ports/object-storage.port";
import { GenerateDownloadUrlUseCase } from "../use-cases/generate-download-url.use-case";

describe("GenerateDownloadUrlUseCase", () => {
  let useCase: GenerateDownloadUrlUseCase;
  let mockObjectStorage: IObjectStoragePort;

  beforeEach(() => {
    mockObjectStorage = {
      generateUploadUrl: vi.fn(),
      generateDownloadUrl: vi
        .fn()
        .mockResolvedValue("https://r2.example.com/download-url"),
      deleteObject: vi.fn(),
      getObjectMetadata: vi.fn(),
      uploadObject: vi.fn(),
    };

    useCase = new GenerateDownloadUrlUseCase(mockObjectStorage);
  });

  it("should generate download url successfully", async () => {
    const result = await useCase.execute({
      key: "uploads/test-file.png",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.downloadUrl).toBe(
      "https://r2.example.com/download-url",
    );
    expect(result.value.expiresAt).toBeInstanceOf(Date);

    expect(mockObjectStorage.generateDownloadUrl).toHaveBeenCalledWith({
      key: "uploads/test-file.png",
      expiresInSeconds: 3600,
    });
  });

  it("should fail for empty key", async () => {
    const result = await useCase.execute({
      key: "",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toContain("File key cannot be empty");
  });

  it("should fail for key exceeding max length", async () => {
    const result = await useCase.execute({
      key: "a".repeat(1025),
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toContain(
      "File key cannot exceed 1024 characters",
    );
  });

  it("should fail when object storage throws error", async () => {
    mockObjectStorage.generateDownloadUrl = vi
      .fn()
      .mockRejectedValue(new Error("Storage error"));

    const result = await useCase.execute({
      key: "uploads/test.png",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("Storage error");
  });

  it("should set expiration time 1 hour from now", async () => {
    const beforeExecution = Date.now();

    const result = await useCase.execute({
      key: "uploads/test.png",
    });

    const afterExecution = Date.now();

    expect(result.isSuccess).toBe(true);

    const expiresAtTime = result.value.expiresAt.getTime();
    const expectedMinTime = beforeExecution + 3600 * 1000;
    const expectedMaxTime = afterExecution + 3600 * 1000;

    expect(expiresAtTime).toBeGreaterThanOrEqual(expectedMinTime);
    expect(expiresAtTime).toBeLessThanOrEqual(expectedMaxTime);
  });
});
