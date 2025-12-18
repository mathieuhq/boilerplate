import { describe, expect, it } from "vitest";

import { ImageCompressorService } from "../services/image-compressor.service";

describe("ImageCompressorService", () => {
  const service = new ImageCompressorService();

  it("should compress image to webp format", async () => {
    const pngBuffer = createMinimalPngBuffer();

    const result = await service.compress({ buffer: pngBuffer });

    expect(result.contentType).toBe("image/webp");
    expect(result.extension).toBe("webp");
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it("should use custom quality when provided", async () => {
    const pngBuffer = createMinimalPngBuffer();

    const highQuality = await service.compress({
      buffer: pngBuffer,
      quality: 90,
    });

    const lowQuality = await service.compress({
      buffer: pngBuffer,
      quality: 50,
    });

    expect(highQuality.buffer.length).toBeGreaterThanOrEqual(
      lowQuality.buffer.length,
    );
  });

  it("should not enlarge small images beyond maxWidth", async () => {
    const pngBuffer = createMinimalPngBuffer();

    const result = await service.compress({
      buffer: pngBuffer,
      maxWidth: 1920,
    });

    expect(result.buffer).toBeInstanceOf(Buffer);
  });
});

function createMinimalPngBuffer(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
    0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}
