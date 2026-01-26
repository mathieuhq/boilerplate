import { User } from "better-auth";

import type { Language, NotificationType } from "@/db/types";

export type AuthUser = User & {
  role?: string;
  language?: Language;
  socialEmails?: boolean;
  birthDate?: Date | null;
  securityEmails?: boolean;
  marketingEmails?: boolean;
  communicationEmails?: boolean;
  notificationType?: NotificationType;
};
