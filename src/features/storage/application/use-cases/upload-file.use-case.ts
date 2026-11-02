import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { FileKey } from "../../domain/value-objects/file-key.value-object";
import type {
  UploadFileInputDTO,
  UploadFileOutputDTO,
} from "../dto/presigned-url.dto";
import type { IObjectStoragePort } from "../ports/object-storage.port";

export class UploadFileUseCase implements IUseCase<
  UploadFileInputDTO,
  UploadFileOutputDTO
> {
  constructor(private readonly objectStorage: IObjectStoragePort) {}

  async execute(
    input: UploadFileInputDTO,
  ): Promise<Result<UploadFileOutputDTO>> {
    try {
      const fileKey = FileKey.create(input.key);

      await this.objectStorage.uploadObject({
        key: fileKey.value,
        body: input.body,
        contentType: input.contentType,
      });

      return Result.ok({ key: fileKey.value });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
