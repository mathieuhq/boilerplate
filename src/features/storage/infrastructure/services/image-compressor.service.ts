import sharp from "sharp";

import { InvalidFileTypeError } from "../../domain/errors/invalid-file-type.error";

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

const TIMEOUT_SECONDS = 10;
const DEFAULT_QUALITY = 80;
const DEFAULT_MAX_WIDTH = 1920;
const MAX_INPUT_PIXELS = 40_000_000;
const SUPPORTED_FORMATS = ["jpeg", "png", "gif", "webp"] as const;

export class ImageCompressorService {
  async compress(input: CompressImageInput): Promise<CompressImageOutput> {
    const quality = input.quality ?? DEFAULT_QUALITY;
    const maxWidth = input.maxWidth ?? DEFAULT_MAX_WIDTH;
    const image = sharp(input.buffer, { limitInputPixels: MAX_INPUT_PIXELS });

    const { format } = await image.metadata();

    if (!SUPPORTED_FORMATS.some((supported) => supported === format))
      throw new InvalidFileTypeError(format, SUPPORTED_FORMATS);

    const compressed = await image
      .resize(maxWidth, undefined, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality })
      .timeout({ seconds: TIMEOUT_SECONDS })
      .toBuffer();

    return {
      extension: "webp",
      buffer: compressed,
      contentType: "image/webp",
    };
  }
}
