import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { FileTooLargeError } from "../../domain/errors/file-too-large.error";
import { ContentType } from "../../domain/value-objects/content-type.value-object";
import { FileKey } from "../../domain/value-objects/file-key.value-object";
import type {
  ProcessAndUploadFileInputDTO,
  ProcessAndUploadFileOutputDTO,
} from "../dto/presigned-url.dto";
import type { IImageCompressorPort } from "../ports/image-compressor.port";
import type { IObjectStoragePort } from "../ports/object-storage.port";

const AVATAR_MAX_WIDTH = 512;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const AVATAR_PREFIXES = new Set(["user-avatars", "organization-avatars"]);

export class ProcessAndUploadFileUseCase implements IUseCase<
  ProcessAndUploadFileInputDTO,
  ProcessAndUploadFileOutputDTO
> {
  constructor(
    private readonly objectStorage: IObjectStoragePort,
    private readonly imageCompressor: IImageCompressorPort,
  ) {}

  async execute(
    input: ProcessAndUploadFileInputDTO,
  ): Promise<Result<ProcessAndUploadFileOutputDTO>> {
    try {
      if (input.buffer.byteLength > MAX_FILE_SIZE_BYTES)
        return Result.fail(
          new FileTooLargeError(input.buffer.byteLength, MAX_FILE_SIZE_BYTES),
        );

      ContentType.create(input.contentType);

      const prefix = input.prefix ?? "uploads";

      const compressed = await this.imageCompressor.compress(
        AVATAR_PREFIXES.has(prefix)
          ? { buffer: input.buffer, maxWidth: AVATAR_MAX_WIDTH }
          : { buffer: input.buffer },
      );

      const fileKey = FileKey.generate(prefix, compressed.extension);

      await this.objectStorage.uploadObject({
        key: fileKey.value,
        body: compressed.buffer,
        contentType: compressed.contentType,
      });

      return Result.ok({
        key: fileKey.value,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
