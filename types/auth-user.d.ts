import { User } from "better-auth";

import type { Language } from "@/lib/generated/prisma/enums";

export type AuthUser = User & {
  birthDate?: Date | null;
  language?: Language;
};
