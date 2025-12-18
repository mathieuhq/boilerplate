import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/value-object.base";

type ContentTypeProps = {
  value: string;
};

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export class ContentType extends ValueObject<ContentTypeProps> {
  private constructor(props: ContentTypeProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(contentType: string): ContentType {
    if (!contentType || contentType.trim().length === 0)
      throw new DomainError("Content type cannot be empty");

    const normalizedType = contentType.toLowerCase().trim();

    if (!ALLOWED_IMAGE_TYPES.includes(normalizedType as AllowedImageType))
      throw new DomainError(
        `Invalid content type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
      );

    return new ContentType({ value: normalizedType });
  }

  static getAllowedTypes(): readonly string[] {
    return ALLOWED_IMAGE_TYPES;
  }

  equals(other: ContentType): boolean {
    return this.value === other.value;
  }
}
