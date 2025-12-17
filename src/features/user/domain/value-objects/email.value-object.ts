import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/value-object.base";

type EmailProps = {
  value: string;
};

export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): Email {
    if (!email || !this.EMAIL_REGEX.test(email))
      throw new DomainError("Invalid email format");

    return new Email({ value: email.toLowerCase() });
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
