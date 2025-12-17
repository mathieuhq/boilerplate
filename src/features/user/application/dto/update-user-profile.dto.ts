import type { Language } from "../../domain/entities/user.types";

export type UpdateUserProfileDTO = {
  name?: string;
  userId: string;
  email?: string;
  image?: string;
  birthDate?: Date;
  language?: Language;
};
