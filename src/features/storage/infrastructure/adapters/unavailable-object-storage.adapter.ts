import { HttpError } from "@/shared/domain/errors/http.error";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

import type {
  DeleteObjectParams,
  GenerateDownloadUrlParams,
  GenerateUploadUrlParams,
  GetObjectMetadataParams,
  IObjectStoragePort,
  ObjectMetadata,
  UploadObjectParams,
} from "../../application/ports/object-storage.port";

const STORAGE_NOT_CONFIGURED = "STORAGE_NOT_CONFIGURED";

export class UnavailableObjectStorageAdapter implements IObjectStoragePort {
  async deleteObject(_params: DeleteObjectParams): Promise<void> {
    throw this.createError();
  }

  async uploadObject(_params: UploadObjectParams): Promise<void> {
    throw this.createError();
  }

  async generateUploadUrl(_params: GenerateUploadUrlParams): Promise<string> {
    throw this.createError();
  }

  async generateDownloadUrl(
    _params: GenerateDownloadUrlParams,
  ): Promise<string> {
    throw this.createError();
  }

  async getObjectMetadata(
    _params: GetObjectMetadataParams,
  ): Promise<ObjectMetadata | null> {
    throw this.createError();
  }

  private createError() {
    return new HttpError(
      STORAGE_NOT_CONFIGURED,
      "Storage is not configured",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
