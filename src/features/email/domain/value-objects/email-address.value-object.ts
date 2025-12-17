import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/value-object.base";

type EmailAddressProps = {
  value: string;
};

export class EmailAddress extends ValueObject<EmailAddressProps> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(props: EmailAddressProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): EmailAddress {
    if (!email || !this.EMAIL_REGEX.test(email)) {
      throw new DomainError("Invalid email address format");
    }
    return new EmailAddress({ value: email.toLowerCase() });
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}
