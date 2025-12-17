import type { User } from "../../domain/entities/user.entity";
import type {
  Language,
  NotificationPreferences,
} from "../../domain/entities/user.types";

export type UserResponseDTO = {
  id: string;
  email: string;
  name: string;
  image?: string;
  language: Language;
  birthDate?: Date;
  emailVerified: boolean;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
};

export function toUserResponseDTO(user: User): UserResponseDTO {
  return {
    id: user.id.value,
    email: user.email.value,
    name: user.name,
    image: user.image,
    language: user.language,
    birthDate: user.birthDate,
    emailVerified: user.isEmailVerified,
    notificationPreferences: user.notificationPreferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
