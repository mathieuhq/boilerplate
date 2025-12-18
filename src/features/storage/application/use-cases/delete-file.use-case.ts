import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { FileKey } from "../../domain/value-objects/file-key.value-object";
import type {
  DeleteFileInputDTO,
  DeleteFileOutputDTO,
} from "../dto/presigned-url.dto";
import type { IObjectStoragePort } from "../ports/object-storage.port";

export class DeleteFileUseCase implements IUseCase<
  DeleteFileInputDTO,
  DeleteFileOutputDTO
> {
  constructor(private readonly objectStorage: IObjectStoragePort) {}

  async execute(
    input: DeleteFileInputDTO,
  ): Promise<Result<DeleteFileOutputDTO>> {
    try {
      const fileKey = FileKey.create(input.key);

      await this.objectStorage.deleteObject({
        key: fileKey.value,
      });

      return Result.ok({
        success: true,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
