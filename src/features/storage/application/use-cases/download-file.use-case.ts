import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { FileKey } from "../../domain/value-objects/file-key.value-object";
import type {
  DownloadFileInputDTO,
  DownloadFileOutputDTO,
} from "../dto/presigned-url.dto";
import type { IObjectStoragePort } from "../ports/object-storage.port";

export class DownloadFileUseCase implements IUseCase<
  DownloadFileInputDTO,
  DownloadFileOutputDTO
> {
  constructor(private readonly objectStorage: IObjectStoragePort) {}

  async execute(
    input: DownloadFileInputDTO,
  ): Promise<Result<DownloadFileOutputDTO>> {
    try {
      const fileKey = FileKey.create(input.key);

      const body = await this.objectStorage.downloadObject({
        key: fileKey.value,
      });

      return Result.ok({ body });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
