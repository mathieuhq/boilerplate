import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IObjectStoragePort } from "../ports/object-storage.port";
import { DownloadFileUseCase } from "../use-cases/download-file.use-case";

describe("DownloadFileUseCase", () => {
  let useCase: DownloadFileUseCase;
  let mockObjectStorage: IObjectStoragePort;

  beforeEach(() => {
    mockObjectStorage = {
      generateUploadUrl: vi.fn(),
      generateDownloadUrl: vi.fn(),
      deleteObject: vi.fn(),
      getObjectMetadata: vi.fn(),
      uploadObject: vi.fn(),
      downloadObject: vi.fn().mockResolvedValue(Buffer.from("image")),
    };

    useCase = new DownloadFileUseCase(mockObjectStorage);
  });

  it("should return the object body", async () => {
    const result = await useCase.execute({ key: "user-avatars/a.webp" });

    expect(result.isSuccess).toBe(true);
    expect(result.value.body).toEqual(Buffer.from("image"));
    expect(mockObjectStorage.downloadObject).toHaveBeenCalledWith({
      key: "user-avatars/a.webp",
    });
  });

  it("should return null when the object does not exist", async () => {
    vi.mocked(mockObjectStorage.downloadObject).mockResolvedValue(null);

    const result = await useCase.execute({ key: "user-avatars/a.webp" });

    expect(result.value.body).toBeNull();
  });

  it("should fail for invalid keys", async () => {
    const result = await useCase.execute({ key: "../etc/passwd" });

    expect(result.isFailure).toBe(true);
    expect(mockObjectStorage.downloadObject).not.toHaveBeenCalled();
  });

  it("should wrap non-Error thrown values in Error", async () => {
    vi.mocked(mockObjectStorage.downloadObject).mockRejectedValue("boom");

    const result = await useCase.execute({ key: "user-avatars/a.webp" });

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe("boom");
  });
});
