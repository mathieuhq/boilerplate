import { Result } from "@/shared/application/result";
import type { IUseCase } from "@/shared/application/use-case.interface";

import { FileTooLargeError } from "../../domain/errors/file-too-large.error";
import { ContentType } from "../../domain/value-objects/content-type.value-object";
import { FileKey } from "../../domain/value-objects/file-key.value-object";
import type {
  GenerateUploadUrlInputDTO,
  GenerateUploadUrlOutputDTO,
} from "../dto/presigned-url.dto";
import type { IObjectStoragePort } from "../ports/object-storage.port";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const DEFAULT_EXPIRATION_SECONDS = 3600; // 1 hour

export class GenerateUploadUrlUseCase implements IUseCase<
  GenerateUploadUrlInputDTO,
  GenerateUploadUrlOutputDTO
> {
  constructor(private readonly objectStorage: IObjectStoragePort) {}

  async execute(
    input: GenerateUploadUrlInputDTO,
  ): Promise<Result<GenerateUploadUrlOutputDTO>> {
    try {
      if (input.fileSize > MAX_FILE_SIZE) {
        return Result.fail(
          new FileTooLargeError(input.fileSize, MAX_FILE_SIZE),
        );
      }

      const contentType = ContentType.create(input.contentType);
      const prefix = input.prefix ?? "uploads";
      const extension = this.getExtensionFromContentType(input.contentType);
      const fileKey = FileKey.generate(prefix, extension);

      const uploadUrl = await this.objectStorage.generateUploadUrl({
        key: fileKey.value,
        contentType: contentType.value,
        expiresInSeconds: DEFAULT_EXPIRATION_SECONDS,
      });

      const expiresAt = new Date(
        Date.now() + DEFAULT_EXPIRATION_SECONDS * 1000,
      );

      return Result.ok({
        uploadUrl,
        expiresAt,
        key: fileKey.value,
      });
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private getExtensionFromContentType(contentType: string): string {
    const mapping: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    return mapping[contentType] ?? "bin";
  }
}
