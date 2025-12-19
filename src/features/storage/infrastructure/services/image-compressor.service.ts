import sharp from "sharp";

type CompressImageInput = {
  buffer: Buffer;
  quality?: number;
  maxWidth?: number;
};

type CompressImageOutput = {
  buffer: Buffer;
  extension: string;
  contentType: string;
};

const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_WIDTH = 1920;

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
      extension: "webp",
      buffer: compressed,
      contentType: "image/webp",
    };
  }
}
