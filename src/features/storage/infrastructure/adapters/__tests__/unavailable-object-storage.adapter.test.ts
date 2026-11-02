import { describe, expect, it } from "vitest";

import { HttpError } from "@/shared/domain/errors/http.error";

import { UnavailableObjectStorageAdapter } from "../unavailable-object-storage.adapter";

describe("UnavailableObjectStorageAdapter", () => {
  it("throws STORAGE_NOT_CONFIGURED for upload urls", async () => {
    const adapter = new UnavailableObjectStorageAdapter();

    await expect(
      adapter.generateUploadUrl({
        key: "uploads/test.png",
        contentType: "image/png",
      }),
    ).rejects.toMatchObject({
      code: "STORAGE_NOT_CONFIGURED",
      message: "Storage is not configured",
    });
  });

  it("throws HttpError for every storage operation", async () => {
    const adapter = new UnavailableObjectStorageAdapter();

    await expect(
      adapter.generateDownloadUrl({ key: "uploads/test.png" }),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      adapter.deleteObject({ key: "uploads/test.png" }),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      adapter.getObjectMetadata({ key: "uploads/test.png" }),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      adapter.uploadObject({
        key: "uploads/test.png",
        body: Buffer.from("test"),
        contentType: "image/png",
      }),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      adapter.downloadObject({ key: "uploads/test.png" }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});
