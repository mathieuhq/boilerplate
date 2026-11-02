import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/value-object.base";

type FileKeyProps = {
  value: string;
};

export class FileKey extends ValueObject<FileKeyProps> {
  private static readonly MAX_LENGTH = 1024;
  private static readonly MANAGED_PREFIXES = new Set([
    "uploads",
    "user-avatars",
    "organization-avatars",
    "data-exports",
  ]);

  private constructor(props: FileKeyProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(key: string): FileKey {
    const value = key.trim();

    if (!value) throw new DomainError("File key cannot be empty");

    if (value.length > this.MAX_LENGTH)
      throw new DomainError(
        `File key cannot exceed ${this.MAX_LENGTH} characters`,
      );

    if (/^https?:\/\//i.test(value))
      throw new DomainError("File key cannot be an external URL");

    if (value.startsWith("/") || value.includes("\\") || value.includes("//"))
      throw new DomainError("File key contains invalid path separators");

    const segments = value.split("/");

    if (
      segments.some(
        (segment) => !segment || segment === "." || segment === "..",
      )
    )
      throw new DomainError("File key contains invalid path segments");

    const [prefix] = segments;

    if (!this.MANAGED_PREFIXES.has(prefix))
      throw new DomainError("File key prefix is not managed by this app");

    return new FileKey({ value });
  }

  static generate(prefix: string, extension: string): FileKey {
    if (!this.MANAGED_PREFIXES.has(prefix))
      throw new DomainError("File key prefix is not managed by this app");

    if (!/^[a-z0-9]+$/i.test(extension))
      throw new DomainError("File key extension is invalid");

    const uuid = crypto.randomUUID();

    const key = `${prefix}/${uuid}.${extension}`;

    return FileKey.create(key);
  }

  equals(other: FileKey): boolean {
    return this.value === other.value;
  }
}
