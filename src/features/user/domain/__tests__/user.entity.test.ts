import { beforeEach, describe, expect, it } from "vitest";

import type { UserProps } from "../entities/user.entity";
import { User } from "../entities/user.entity";
import { Email } from "../value-objects/email.value-object";
import { UserId } from "../value-objects/user-id.value-object";

describe("User Entity", () => {
  let defaultProps: UserProps;

  beforeEach(() => {
    defaultProps = {
      id: UserId.create("user-123"),
      email: Email.create("test@example.com"),
      name: "Test User",
      language: "EN",
      emailVerified: true,
      notificationPreferences: {
        type: "ALL",
        social: true,
        security: true,
        marketing: false,
        communication: true,
      },
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };
  });

  describe("create", () => {
    it("should create a user with all properties", () => {
      const user = User.create(defaultProps);
      expect(user.id.value).toBe("user-123");
      expect(user.email.value).toBe("test@example.com");
      expect(user.name).toBe("Test User");
      expect(user.language).toBe("EN");
      expect(user.isEmailVerified).toBe(true);
    });

    it("should create a user with optional properties", () => {
      const props: UserProps = {
        ...defaultProps,
        image: "https://example.com/avatar.png",
        birthDate: new Date("1990-01-01"),
        emailContactId: "contact-123",
      };
      const user = User.create(props);
      expect(user.image).toBe("https://example.com/avatar.png");
      expect(user.birthDate).toEqual(new Date("1990-01-01"));
      expect(user.emailContactId).toBe("contact-123");
    });
  });

  describe("getters", () => {
    it("should return notification preferences", () => {
      const user = User.create(defaultProps);
      expect(user.notificationPreferences).toEqual({
        type: "ALL",
        social: true,
        security: true,
        marketing: false,
        communication: true,
      });
    });

    it("should return isSubscribedToMarketing correctly", () => {
      const user = User.create(defaultProps);
      expect(user.isSubscribedToMarketing).toBe(false);

      const userWithMarketing = User.create({
        ...defaultProps,
        notificationPreferences: {
          ...defaultProps.notificationPreferences,
          marketing: true,
        },
      });
      expect(userWithMarketing.isSubscribedToMarketing).toBe(true);
    });

    it("should return hasEmailContact correctly", () => {
      const user = User.create(defaultProps);
      expect(user.hasEmailContact).toBe(false);

      const userWithContact = User.create({
        ...defaultProps,
        emailContactId: "contact-123",
      });
      expect(userWithContact.hasEmailContact).toBe(true);
    });
  });

  describe("updateProfile", () => {
    it("should update name when provided", () => {
      const user = User.create(defaultProps);
      user.updateProfile({ name: "New Name" });
      expect(user.name).toBe("New Name");
    });

    it("should update image when provided", () => {
      const user = User.create(defaultProps);
      user.updateProfile({ image: "https://new-image.com/avatar.png" });
      expect(user.image).toBe("https://new-image.com/avatar.png");
    });

    it("should update language when provided", () => {
      const user = User.create(defaultProps);
      user.updateProfile({ language: "FR" });
      expect(user.language).toBe("FR");
    });

    it("should update birthDate when provided", () => {
      const user = User.create(defaultProps);
      const newBirthDate = new Date("1995-05-15");
      user.updateProfile({ birthDate: newBirthDate });
      expect(user.birthDate).toEqual(newBirthDate);
    });

    it("should update updatedAt timestamp", () => {
      const user = User.create(defaultProps);
      const originalUpdatedAt = user.updatedAt;
      user.updateProfile({ name: "New Name" });
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });

    it("should update multiple fields at once", () => {
      const user = User.create(defaultProps);
      user.updateProfile({
        name: "Updated Name",
        language: "FR",
      });
      expect(user.name).toBe("Updated Name");
      expect(user.language).toBe("FR");
    });
  });

  describe("updateNotificationPreferences", () => {
    it("should update partial notification preferences", () => {
      const user = User.create(defaultProps);
      user.updateNotificationPreferences({ social: false });
      expect(user.notificationPreferences.social).toBe(false);
      expect(user.notificationPreferences.security).toBe(true);
    });

    it("should update multiple notification preferences", () => {
      const user = User.create(defaultProps);
      user.updateNotificationPreferences({
        social: false,
        marketing: true,
      });
      expect(user.notificationPreferences.social).toBe(false);
      expect(user.notificationPreferences.marketing).toBe(true);
    });

    it("should update updatedAt timestamp", () => {
      const user = User.create(defaultProps);
      const originalUpdatedAt = user.updatedAt;
      user.updateNotificationPreferences({ social: false });
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe("setEmailContactId", () => {
    it("should set the email contact id", () => {
      const user = User.create(defaultProps);
      user.setEmailContactId("new-contact-id");
      expect(user.emailContactId).toBe("new-contact-id");
    });

    it("should update updatedAt timestamp", () => {
      const user = User.create(defaultProps);
      const originalUpdatedAt = user.updatedAt;
      user.setEmailContactId("contact-123");
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        originalUpdatedAt.getTime(),
      );
    });
  });

  describe("shouldSubscribeToMarketing", () => {
    it("should return true when enabling marketing and currently disabled", () => {
      const user = User.create(defaultProps);
      expect(user.shouldSubscribeToMarketing(true)).toBe(true);
    });

    it("should return false when marketing already enabled", () => {
      const user = User.create({
        ...defaultProps,
        notificationPreferences: {
          ...defaultProps.notificationPreferences,
          marketing: true,
        },
      });
      expect(user.shouldSubscribeToMarketing(true)).toBe(false);
    });

    it("should return false when disabling marketing", () => {
      const user = User.create(defaultProps);
      expect(user.shouldSubscribeToMarketing(false)).toBe(false);
    });
  });

  describe("shouldUnsubscribeFromMarketing", () => {
    it("should return true when disabling marketing and currently enabled", () => {
      const user = User.create({
        ...defaultProps,
        notificationPreferences: {
          ...defaultProps.notificationPreferences,
          marketing: true,
        },
      });
      expect(user.shouldUnsubscribeFromMarketing(false)).toBe(true);
    });

    it("should return false when marketing already disabled", () => {
      const user = User.create(defaultProps);
      expect(user.shouldUnsubscribeFromMarketing(false)).toBe(false);
    });

    it("should return false when enabling marketing", () => {
      const user = User.create({
        ...defaultProps,
        notificationPreferences: {
          ...defaultProps.notificationPreferences,
          marketing: true,
        },
      });
      expect(user.shouldUnsubscribeFromMarketing(true)).toBe(false);
    });
  });
});
