export type CompressImageInput = {
  buffer: Buffer;
  quality?: number;
  maxWidth?: number;
};

export type CompressImageOutput = {
  buffer: Buffer;
  extension: string;
  contentType: string;
};

export type IImageCompressorPort = {
  compress: (input: CompressImageInput) => Promise<CompressImageOutput>;
};
