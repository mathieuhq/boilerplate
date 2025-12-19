import {
  User,
  type UserProps,
} from "@/features/user/domain/entities/user.entity";
import { Email } from "@/features/user/domain/value-objects/email.value-object";
import { UserId } from "@/features/user/domain/value-objects/user-id.value-object";

export function buildUser(overrides: Partial<UserProps> = {}): User {
  const defaultProps: UserProps = {
    id: UserId.create("user-123"),
    email: Email.create("test@example.com"),
    language: "EN",
    name: "Test User",
    emailVerified: true,
    notificationPreferences: {
      type: "ALL",
      social: true,
      security: true,
      marketing: false,
      communication: true,
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
  return User.create(defaultProps);
}
