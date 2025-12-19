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

export type IImageCompressorPort = {
  compress: (input: CompressImageInput) => Promise<CompressImageOutput>;
};
