import type { User as PrismaUser } from "@/lib/generated/prisma/client";

import { User, type UserProps } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";

export type UserRecord = Pick<
  PrismaUser,
  | "id"
  | "name"
  | "email"
  | "image"
  | "language"
  | "birthDate"
  | "createdAt"
  | "updatedAt"
  | "socialEmails"
  | "emailVerified"
  | "emailContactId"
  | "securityEmails"
  | "marketingEmails"
  | "notificationType"
  | "communicationEmails"
>;

export function toDomain(raw: UserRecord): User {
  const props: UserProps = {
    name: raw.name,
    language: raw.language,
    id: UserId.create(raw.id),
    image: raw.image ?? undefined,
    email: Email.create(raw.email),
    emailVerified: raw.emailVerified,
    birthDate: raw.birthDate ?? undefined,
    emailContactId: raw.emailContactId ?? undefined,
    notificationPreferences: {
      social: raw.socialEmails,
      type: raw.notificationType,
      security: raw.securityEmails,
      marketing: raw.marketingEmails,
      communication: raw.communicationEmails,
    },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  return User.create(props);
}

export function toPersistence(user: User): UserRecord {
  return {
    name: user.name,
    id: user.id.value,
    email: user.email.value,
    language: user.language,
    image: user.image ?? null,
    birthDate: user.birthDate ?? null,
    emailVerified: user.isEmailVerified,
    emailContactId: user.emailContactId ?? null,
    socialEmails: user.notificationPreferences.social,
    notificationType: user.notificationPreferences.type,
    securityEmails: user.notificationPreferences.security,
    marketingEmails: user.notificationPreferences.marketing,
    communicationEmails: user.notificationPreferences.communication,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
