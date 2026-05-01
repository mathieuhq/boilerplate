import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IObjectStoragePort } from "../ports/object-storage.port";
import { DeleteFileUseCase } from "../use-cases/delete-file.use-case";

describe("DeleteFileUseCase", () => {
  let useCase: DeleteFileUseCase;
  let mockObjectStorage: IObjectStoragePort;

  beforeEach(() => {
    mockObjectStorage = {
      generateUploadUrl: vi.fn(),
      generateDownloadUrl: vi.fn(),
      deleteObject: vi.fn().mockResolvedValue(undefined),
      getObjectMetadata: vi.fn(),
      uploadObject: vi.fn(),
    };

    useCase = new DeleteFileUseCase(mockObjectStorage);
  });

  it("should delete file successfully", async () => {
    const result = await useCase.execute({
      key: "uploads/test-file.png",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.success).toBe(true);

    expect(mockObjectStorage.deleteObject).toHaveBeenCalledWith({
      key: "uploads/test-file.png",
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
    mockObjectStorage.deleteObject = vi
      .fn()
      .mockRejectedValue(new Error("Storage error"));

    const result = await useCase.execute({
      key: "uploads/test.png",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("Storage error");
  });

  it("should handle nested file paths", async () => {
    const result = await useCase.execute({
      key: "users/123/profile.png",
    });

    expect(result.isSuccess).toBe(true);
    expect(mockObjectStorage.deleteObject).toHaveBeenCalledWith({
      key: "users/123/profile.png",
    });
  });

  it("should wrap non-Error thrown values in Error", async () => {
    mockObjectStorage.deleteObject = vi.fn().mockRejectedValue("string error");

    const result = await useCase.execute({
      key: "uploads/test.png",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("string error");
  });
});
