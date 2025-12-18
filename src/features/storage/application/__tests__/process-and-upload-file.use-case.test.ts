import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImageCompressorService } from "../../infrastructure/services/image-compressor.service";
import type { IObjectStoragePort } from "../ports/object-storage.port";
import { ProcessAndUploadFileUseCase } from "../use-cases/process-and-upload-file.use-case";

describe("ProcessAndUploadFileUseCase", () => {
  let useCase: ProcessAndUploadFileUseCase;
  let mockObjectStorage: IObjectStoragePort;
  let mockImageCompressor: ImageCompressorService;

  beforeEach(() => {
    mockObjectStorage = {
      generateUploadUrl: vi.fn(),
      generateDownloadUrl: vi.fn(),
      deleteObject: vi.fn(),
      getObjectMetadata: vi.fn(),
      uploadObject: vi.fn().mockResolvedValue(undefined),
    };

    mockImageCompressor = {
      compress: vi.fn().mockResolvedValue({
        buffer: Buffer.from("compressed"),
        contentType: "image/webp",
        extension: "webp",
      }),
    };

    useCase = new ProcessAndUploadFileUseCase(
      mockObjectStorage,
      mockImageCompressor,
    );
  });

  it("should compress and upload file successfully", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid");

    const inputBuffer = Buffer.from("original image data");
    const result = await useCase.execute({
      buffer: inputBuffer,
      contentType: "image/png",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.key).toBe("uploads/test-uuid.webp");

    expect(mockImageCompressor.compress).toHaveBeenCalledWith({
      buffer: inputBuffer,
    });

    expect(mockObjectStorage.uploadObject).toHaveBeenCalledWith({
      key: "uploads/test-uuid.webp",
      body: Buffer.from("compressed"),
      contentType: "image/webp",
    });

    vi.restoreAllMocks();
  });

  it("should use custom prefix when provided", async () => {
    vi.spyOn(crypto, "randomUUID").mockReturnValue("uuid");

    const result = await useCase.execute({
      buffer: Buffer.from("data"),
      contentType: "image/jpeg",
      prefix: "avatars",
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.key).toBe("avatars/uuid.webp");

    vi.restoreAllMocks();
  });

  it("should fail for invalid content type", async () => {
    const result = await useCase.execute({
      buffer: Buffer.from("data"),
      contentType: "application/pdf",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toContain("Invalid content type");
  });

  it("should fail when compression throws error", async () => {
    mockImageCompressor.compress = vi
      .fn()
      .mockRejectedValue(new Error("Compression failed"));

    const result = await useCase.execute({
      buffer: Buffer.from("data"),
      contentType: "image/png",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("Compression failed");
  });

  it("should fail when upload throws error", async () => {
    mockObjectStorage.uploadObject = vi
      .fn()
      .mockRejectedValue(new Error("Upload failed"));

    const result = await useCase.execute({
      buffer: Buffer.from("data"),
      contentType: "image/png",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("Upload failed");
  });

  it("should wrap non-Error thrown values in Error", async () => {
    mockObjectStorage.uploadObject = vi.fn().mockRejectedValue("string error");

    const result = await useCase.execute({
      buffer: Buffer.from("data"),
      contentType: "image/png",
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("string error");
  });
});
