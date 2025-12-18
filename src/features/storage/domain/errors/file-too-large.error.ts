import { DomainError } from "@/shared/domain/errors/domain.error";

export class FileTooLargeError extends DomainError {
  constructor(fileSize: number, maxSize: number) {
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    super(
      `File size (${fileSizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
    );
    this.name = "FileTooLargeError";
  }
}
