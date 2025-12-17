import { Entity } from "@/shared/domain/entity.base";

import type { Email } from "../value-objects/email.value-object";
import type { UserId } from "../value-objects/user-id.value-object";

import type { Language, NotificationPreferences } from "./user.types";

export type UserProps = {
  id: UserId;
  email: Email;
  name: string;
  image?: string;
  language: Language;
  birthDate?: Date;
  emailVerified: boolean;
  stripeCustomerId?: string;
  resendContactId?: string;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
};

export class User extends Entity<UserProps> {
  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get image(): string | undefined {
    return this.props.image;
  }

  get language(): Language {
    return this.props.language;
  }

  get birthDate(): Date | undefined {
    return this.props.birthDate;
  }

  get isEmailVerified(): boolean {
    return this.props.emailVerified;
  }

  get stripeCustomerId(): string | undefined {
    return this.props.stripeCustomerId;
  }

  get resendContactId(): string | undefined {
    return this.props.resendContactId;
  }

  get notificationPreferences(): NotificationPreferences {
    return this.props.notificationPreferences;
  }

  get isSubscribedToMarketing(): boolean {
    return this.props.notificationPreferences.marketing;
  }

  get hasResendContact(): boolean {
    return !!this.props.resendContactId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateProfile(data: {
    name?: string;
    email?: Email;
    image?: string;
    birthDate?: Date;
    language?: Language;
  }): void {
    if (data.name) this.props.name = data.name;
    if (data.email) this.props.email = data.email;
    if (data.image) this.props.image = data.image;
    if (data.birthDate) this.props.birthDate = data.birthDate;
    if (data.language) this.props.language = data.language;
    this.props.updatedAt = new Date();
  }

  updateNotificationPreferences(prefs: Partial<NotificationPreferences>): void {
    this.props.notificationPreferences = {
      ...this.props.notificationPreferences,
      ...prefs,
    };
    this.props.updatedAt = new Date();
  }

  setResendContactId(contactId: string): void {
    this.props.resendContactId = contactId;
    this.props.updatedAt = new Date();
  }

  shouldSubscribeToMarketing(newMarketingPref: boolean): boolean {
    return (
      newMarketingPref === true && !this.props.notificationPreferences.marketing
    );
  }

  shouldUnsubscribeFromMarketing(newMarketingPref: boolean): boolean {
    return (
      newMarketingPref === false && this.props.notificationPreferences.marketing
    );
  }
}
