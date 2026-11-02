import type { DeleteFileUseCase } from "../../application/use-cases/delete-file.use-case";
import type { DownloadFileUseCase } from "../../application/use-cases/download-file.use-case";
import type { GenerateDownloadUrlUseCase } from "../../application/use-cases/generate-download-url.use-case";
import type { GenerateUploadUrlUseCase } from "../../application/use-cases/generate-upload-url.use-case";
import type { ProcessAndUploadFileUseCase } from "../../application/use-cases/process-and-upload-file.use-case";
import type { UploadFileUseCase } from "../../application/use-cases/upload-file.use-case";

export class StorageController {
  constructor(
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
    private readonly generateDownloadUrlUseCase: GenerateDownloadUrlUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly processAndUploadFileUseCase: ProcessAndUploadFileUseCase,
    private readonly uploadFileUseCase: UploadFileUseCase,
    private readonly downloadFileUseCase: DownloadFileUseCase,
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

  async generateDownloadUrl(
    key: string,
    options?: { fileName?: string; expiresInSeconds?: number },
  ) {
    const result = await this.generateDownloadUrlUseCase.execute({
      key,
      ...options,
    });

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

  async uploadFile(params: { key: string; body: Buffer; contentType: string }) {
    const result = await this.uploadFileUseCase.execute(params);

    if (result.isFailure) throw result.error;

    return result.value;
  }

  async downloadFile(key: string) {
    const result = await this.downloadFileUseCase.execute({ key });

    if (result.isFailure) throw result.error;

    return result.value.body;
  }
}
