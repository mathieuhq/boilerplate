import sharp from "sharp";

export type CompressImageInput = {
  buffer: Buffer;
  maxWidth?: number;
  quality?: number;
};

export type CompressImageOutput = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_QUALITY = 80;

export class ImageCompressorService {
  async compress(input: CompressImageInput): Promise<CompressImageOutput> {
    const maxWidth = input.maxWidth ?? DEFAULT_MAX_WIDTH;
    const quality = input.quality ?? DEFAULT_QUALITY;

    const compressed = await sharp(input.buffer)
      .resize(maxWidth, undefined, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality })
      .toBuffer();

    return {
      buffer: compressed,
      contentType: "image/webp",
      extension: "webp",
    };
  }
}
