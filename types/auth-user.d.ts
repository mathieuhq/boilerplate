import { User } from "better-auth";

import type { Language, NotificationType } from "@/lib/enums";

export type AuthUser = User & {
  role?: string;
  imageUrl?: string;
  language?: Language;
  socialEmails?: boolean;
  birthDate?: Date | null;
  securityEmails?: boolean;
  marketingEmails?: boolean;
  communicationEmails?: boolean;
  notificationType?: NotificationType;
};
