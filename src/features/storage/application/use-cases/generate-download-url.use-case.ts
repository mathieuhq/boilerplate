import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { FileKey } from "../../domain/value-objects/file-key.value-object";
import type {
  GenerateDownloadUrlInputDTO,
  GenerateDownloadUrlOutputDTO,
} from "../dto/presigned-url.dto";
import type { IObjectStoragePort } from "../ports/object-storage.port";

const DEFAULT_EXPIRATION_SECONDS = 60 * 60;

export class GenerateDownloadUrlUseCase implements IUseCase<
  GenerateDownloadUrlInputDTO,
  GenerateDownloadUrlOutputDTO
> {
  constructor(private readonly objectStorage: IObjectStoragePort) {}

  async execute(
    input: GenerateDownloadUrlInputDTO,
  ): Promise<Result<GenerateDownloadUrlOutputDTO>> {
    try {
      const fileKey = FileKey.create(input.key);

      const expiresInSeconds =
        input.expiresInSeconds ?? DEFAULT_EXPIRATION_SECONDS;

      const downloadUrl = await this.objectStorage.generateDownloadUrl({
        key: fileKey.value,
        fileName: input.fileName,
        expiresInSeconds,
      });

      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      return Result.ok({
        downloadUrl,
        expiresAt,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
