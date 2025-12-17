import type { Language } from "../../domain/entities/user.types";

export type UpdateUserProfileDTO = {
  userId: string;
  name?: string;
  email?: string;
  image?: string;
  birthDate?: Date;
  language?: Language;
};
