import type { DeleteFileUseCase } from "../../application/use-cases/delete-file.use-case";
import type { GenerateDownloadUrlUseCase } from "../../application/use-cases/generate-download-url.use-case";
import type { GenerateUploadUrlUseCase } from "../../application/use-cases/generate-upload-url.use-case";
import type { ProcessAndUploadFileUseCase } from "../../application/use-cases/process-and-upload-file.use-case";

export class StorageController {
  constructor(
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
    private readonly generateDownloadUrlUseCase: GenerateDownloadUrlUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly processAndUploadFileUseCase: ProcessAndUploadFileUseCase,
  ) {}

  async generateUploadUrl(params: {
    fileName: string;
    contentType: string;
    fileSize: number;
    prefix?: string;
  }) {
    const result = await this.generateUploadUrlUseCase.execute(params);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async generateDownloadUrl(key: string) {
    const result = await this.generateDownloadUrlUseCase.execute({ key });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async deleteFile(key: string) {
    const result = await this.deleteFileUseCase.execute({ key });

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async processAndUploadFile(params: {
    buffer: Buffer;
    prefix?: string;
    contentType: string;
  }) {
    const result = await this.processAndUploadFileUseCase.execute(params);

    if (result.isFailure) throw result.error;

    return result.value;
  }
}
