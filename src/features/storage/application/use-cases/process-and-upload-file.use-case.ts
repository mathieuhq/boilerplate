import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { ContentType } from "../../domain/value-objects/content-type.value-object";
import { FileKey } from "../../domain/value-objects/file-key.value-object";
import type { ImageCompressorService } from "../../infrastructure/services/image-compressor.service";
import type {
  ProcessAndUploadFileInputDTO,
  ProcessAndUploadFileOutputDTO,
} from "../dto/presigned-url.dto";
import type { IObjectStoragePort } from "../ports/object-storage.port";

export class ProcessAndUploadFileUseCase implements IUseCase<
  ProcessAndUploadFileInputDTO,
  ProcessAndUploadFileOutputDTO
> {
  constructor(
    private readonly objectStorage: IObjectStoragePort,
    private readonly imageCompressor: ImageCompressorService,
  ) {}

  async execute(
    input: ProcessAndUploadFileInputDTO,
  ): Promise<Result<ProcessAndUploadFileOutputDTO>> {
    try {
      ContentType.create(input.contentType);

      const compressed = await this.imageCompressor.compress({
        buffer: input.buffer,
      });

      const prefix = input.prefix ?? "uploads";
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
