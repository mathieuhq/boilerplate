import type { User } from "../../domain/entities/user.entity";
import type {
  Language,
  NotificationPreferences,
} from "../../domain/entities/user.types";

export type UserResponseDTO = {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  birthDate?: Date;
  language: Language;
  emailVerified: boolean;
  notificationPreferences: NotificationPreferences;
};

export function toUserResponseDTO(user: User): UserResponseDTO {
  return {
    name: user.name,
    id: user.id.value,
    image: user.image,
    email: user.email.value,
    language: user.language,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    birthDate: user.birthDate,
    emailVerified: user.isEmailVerified,
    notificationPreferences: user.notificationPreferences,
  };
}
