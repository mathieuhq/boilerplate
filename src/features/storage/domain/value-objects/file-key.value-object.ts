import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/value-object.base";

type FileKeyProps = {
  value: string;
};

export class FileKey extends ValueObject<FileKeyProps> {
  private static readonly MAX_LENGTH = 1024;

  private constructor(props: FileKeyProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(key: string): FileKey {
    if (!key || key.trim().length === 0)
      throw new DomainError("File key cannot be empty");

    if (key.length > this.MAX_LENGTH)
      throw new DomainError(
        `File key cannot exceed ${this.MAX_LENGTH} characters`,
      );

    return new FileKey({ value: key });
  }

  static generate(prefix: string, extension: string): FileKey {
    const uuid = crypto.randomUUID();
    const key = `${prefix}/${uuid}.${extension}`;

    return FileKey.create(key);
  }

  equals(other: FileKey): boolean {
    return this.value === other.value;
  }
}
