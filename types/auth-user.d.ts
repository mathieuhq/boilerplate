import { User } from "better-auth";

import type { Language, NotificationType } from "@/lib/generated/prisma/enums";

export type AuthUser = User & {
  language?: Language;
  socialEmails?: boolean;
  birthDate?: Date | null;
  securityEmails?: boolean;
  marketingEmails?: boolean;
  communicationEmails?: boolean;
  notificationType?: NotificationType;
};
