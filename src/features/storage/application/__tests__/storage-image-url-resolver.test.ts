import { describe, expect, it, vi } from "vitest";

import { resolveStorageImageUrl } from "../services/storage-image-url-resolver";

describe("resolveStorageImageUrl", () => {
  it("should return undefined for empty image values", async () => {
    const generateDownloadUrl = vi.fn();

    await expect(
      resolveStorageImageUrl(null, generateDownloadUrl),
    ).resolves.toBeUndefined();
    await expect(
      resolveStorageImageUrl(undefined, generateDownloadUrl),
    ).resolves.toBeUndefined();

    expect(generateDownloadUrl).not.toHaveBeenCalled();
  });

  it("should leave external image urls unchanged", async () => {
    const generateDownloadUrl = vi.fn();
    const imageUrl = "https://example.com/avatar.png";

    await expect(
      resolveStorageImageUrl(imageUrl, generateDownloadUrl),
    ).resolves.toBe(imageUrl);

    expect(generateDownloadUrl).not.toHaveBeenCalled();
  });

  it("should resolve a raw storage key with a signed download url", async () => {
    const generateDownloadUrl = vi.fn().mockResolvedValue({
      downloadUrl: "https://signed.example.com/avatar.webp",
    });

    await expect(
      resolveStorageImageUrl("user-avatars/avatar.webp", generateDownloadUrl),
    ).resolves.toBe("https://signed.example.com/avatar.webp");

    expect(generateDownloadUrl).toHaveBeenCalledWith(
      "user-avatars/avatar.webp",
    );
  });

  it("should extract storage keys from legacy R2 urls before signing", async () => {
    const generateDownloadUrl = vi.fn().mockResolvedValue({
      downloadUrl: "https://signed.example.com/logo.webp",
    });

    await expect(
      resolveStorageImageUrl(
        "https://account.r2.cloudflarestorage.com/bucket/organization-avatars/logo.webp",
        generateDownloadUrl,
      ),
    ).resolves.toBe("https://signed.example.com/logo.webp");

    expect(generateDownloadUrl).toHaveBeenCalledWith(
      "organization-avatars/logo.webp",
    );
  });

  it("should return undefined and report signing errors", async () => {
    const error = new Error("Storage unavailable");
    const onError = vi.fn();
    const generateDownloadUrl = vi.fn().mockRejectedValue(error);

    await expect(
      resolveStorageImageUrl("user-avatars/avatar.webp", generateDownloadUrl, {
        onError,
      }),
    ).resolves.toBeUndefined();

    expect(onError).toHaveBeenCalledWith(error, "user-avatars/avatar.webp");
  });
});
