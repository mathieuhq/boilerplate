import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IObjectStoragePort } from "../ports/object-storage.port";
import { UploadFileUseCase } from "../use-cases/upload-file.use-case";

describe("UploadFileUseCase", () => {
  let useCase: UploadFileUseCase;
  let mockObjectStorage: IObjectStoragePort;

  beforeEach(() => {
    mockObjectStorage = {
      generateUploadUrl: vi.fn(),
      generateDownloadUrl: vi.fn(),
      deleteObject: vi.fn(),
      getObjectMetadata: vi.fn(),
      uploadObject: vi.fn().mockResolvedValue(undefined),
      downloadObject: vi.fn(),
    };

    useCase = new UploadFileUseCase(mockObjectStorage);
  });

  it("should upload the buffer under the given key", async () => {
    const body = Buffer.from("zip");

    const result = await useCase.execute({
      key: "data-exports/user-1/export-1.zip",
      body,
      contentType: "application/zip",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.key).toBe("data-exports/user-1/export-1.zip");
    expect(mockObjectStorage.uploadObject).toHaveBeenCalledWith({
      key: "data-exports/user-1/export-1.zip",
      body,
      contentType: "application/zip",
    });
  });

  it("should fail for unmanaged prefixes", async () => {
    const result = await useCase.execute({
      key: "secrets/file.zip",
      body: Buffer.from("zip"),
      contentType: "application/zip",
    });

    expect(result.isFailure).toBe(true);
    expect(mockObjectStorage.uploadObject).not.toHaveBeenCalled();
  });

  it("should wrap non-Error thrown values in Error", async () => {
    vi.mocked(mockObjectStorage.uploadObject).mockRejectedValue("boom");

    const result = await useCase.execute({
      key: "uploads/file.zip",
      body: Buffer.from("zip"),
      contentType: "application/zip",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("boom");
  });

  it("should keep Error instances thrown by the storage", async () => {
    const error = new Error("Storage error");
    vi.mocked(mockObjectStorage.uploadObject).mockRejectedValue(error);

    const result = await useCase.execute({
      key: "uploads/file.zip",
      body: Buffer.from("zip"),
      contentType: "application/zip",
    });

    expect(result.error).toBe(error);
  });
});
