import { DomainError } from "@/shared/domain/errors/domain.error";
import { ValueObject } from "@/shared/domain/value-object.base";

type UserIdProps = {
  value: string;
};

export class UserId extends ValueObject<UserIdProps> {
  private constructor(props: UserIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(id: string): UserId {
    if (!id || id.trim().length === 0) {
      throw new DomainError("User ID cannot be empty");
    }
    return new UserId({ value: id });
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
