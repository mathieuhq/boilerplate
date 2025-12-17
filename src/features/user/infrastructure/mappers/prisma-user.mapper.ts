import type { User as PrismaUser } from "@/lib/generated/prisma/client";

import { User, type UserProps } from "../../domain/entities/user.entity";
import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";

export function toDomain(raw: PrismaUser): User {
  const props: UserProps = {
    id: UserId.create(raw.id),
    email: Email.create(raw.email),
    name: raw.name,
    image: raw.image ?? undefined,
    language: raw.language,
    birthDate: raw.birthDate ?? undefined,
    emailVerified: raw.emailVerified,
    stripeCustomerId: raw.stripeCustomerId ?? undefined,
    resendContactId: raw.resendContactId ?? undefined,
    notificationPreferences: {
      type: raw.notificationType,
      social: raw.socialEmails,
      security: raw.securityEmails,
      marketing: raw.marketingEmails,
      communication: raw.communicationEmails,
    },
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  return User.create(props);
}

export function toPersistence(user: User) {
  return {
    id: user.id.value,
    email: user.email.value,
    name: user.name,
    image: user.image ?? null,
    language: user.language,
    birthDate: user.birthDate ?? null,
    emailVerified: user.isEmailVerified,
    stripeCustomerId: user.stripeCustomerId ?? null,
    resendContactId: user.resendContactId ?? null,
    notificationType: user.notificationPreferences.type,
    socialEmails: user.notificationPreferences.social,
    securityEmails: user.notificationPreferences.security,
    marketingEmails: user.notificationPreferences.marketing,
    communicationEmails: user.notificationPreferences.communication,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
