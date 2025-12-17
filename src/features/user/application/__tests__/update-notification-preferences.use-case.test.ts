import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IEmailNotifierPort } from "@/features/user/application/ports/email-notifier.port";
import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import { buildUser } from "@/test/utils/entity-builders";
import {
  createMockEmailNotifier,
  createMockUserRepository,
} from "@/test/utils/mock-factories";

import { UserNotFoundError } from "../../domain/errors/user-not-found.error";
import { UpdateNotificationPreferencesUseCase } from "../use-cases/update-notification-preferences.use-case";

describe("UpdateNotificationPreferencesUseCase", () => {
  let useCase: UpdateNotificationPreferencesUseCase;
  let mockUserRepository: IUserRepository;
  let mockEmailNotifier: IEmailNotifierPort;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockEmailNotifier = createMockEmailNotifier();
    useCase = new UpdateNotificationPreferencesUseCase(
      mockUserRepository,
      mockEmailNotifier,
    );
  });

  describe("when user exists", () => {
    it("should update notification preferences", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      const result = await useCase.execute({
        userId: "user-123",
        social: false,
        security: true,
      });

      expect(result.isSuccess).toBe(true);
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });

    it("should subscribe to marketing when enabling marketing preference", async () => {
      const user = buildUser({
        notificationPreferences: {
          type: "ALL",
          social: true,
          security: true,
          marketing: false,
          communication: true,
        },
      });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);
      vi.mocked(mockEmailNotifier.subscribeContact).mockResolvedValue(
        "contact-123",
      );

      await useCase.execute({
        userId: "user-123",
        marketing: true,
      });

      expect(mockEmailNotifier.subscribeContact).toHaveBeenCalledWith(user);
    });

    it("should set resend contact id when subscription succeeds", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);
      vi.mocked(mockEmailNotifier.subscribeContact).mockResolvedValue(
        "new-contact-id",
      );

      await useCase.execute({
        userId: "user-123",
        marketing: true,
      });

      expect(user.resendContactId).toBe("new-contact-id");
    });

    it("should unsubscribe from marketing when disabling marketing preference", async () => {
      const user = buildUser({
        resendContactId: "contact-123",
        notificationPreferences: {
          type: "ALL",
          social: true,
          security: true,
          marketing: true,
          communication: true,
        },
      });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      await useCase.execute({
        userId: "user-123",
        marketing: false,
      });

      expect(mockEmailNotifier.unsubscribeContact).toHaveBeenCalledWith(
        "contact-123",
      );
    });

    it("should not call subscribe when marketing preference is unchanged", async () => {
      const user = buildUser();
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      await useCase.execute({
        userId: "user-123",
        social: false,
      });

      expect(mockEmailNotifier.subscribeContact).not.toHaveBeenCalled();
      expect(mockEmailNotifier.unsubscribeContact).not.toHaveBeenCalled();
    });

    it("should not call unsubscribe when no resend contact id exists", async () => {
      const user = buildUser({
        notificationPreferences: {
          type: "ALL",
          social: true,
          security: true,
          marketing: true,
          communication: true,
        },
      });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      await useCase.execute({
        userId: "user-123",
        marketing: false,
      });

      expect(mockEmailNotifier.unsubscribeContact).not.toHaveBeenCalled();
    });

    it("should not set resend contact id when subscription returns null", async () => {
      const user = buildUser({
        notificationPreferences: {
          type: "ALL",
          social: true,
          security: true,
          marketing: false,
          communication: true,
        },
      });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);
      vi.mocked(mockEmailNotifier.subscribeContact).mockResolvedValue(null);

      await useCase.execute({
        userId: "user-123",
        marketing: true,
      });

      expect(mockEmailNotifier.subscribeContact).toHaveBeenCalledWith(user);
      expect(user.resendContactId).toBeUndefined();
    });

    it("should not subscribe or unsubscribe when marketing value is unchanged", async () => {
      const user = buildUser({
        notificationPreferences: {
          type: "ALL",
          social: true,
          security: true,
          marketing: true,
          communication: true,
        },
      });
      vi.mocked(mockUserRepository.findById).mockResolvedValue(user);
      vi.mocked(mockUserRepository.save).mockResolvedValue(user);

      await useCase.execute({
        userId: "user-123",
        marketing: true,
      });

      expect(mockEmailNotifier.subscribeContact).not.toHaveBeenCalled();
      expect(mockEmailNotifier.unsubscribeContact).not.toHaveBeenCalled();
    });
  });

  describe("when user does not exist", () => {
    it("should return UserNotFoundError", async () => {
      vi.mocked(mockUserRepository.findById).mockResolvedValue(null);

      const result = await useCase.execute({
        userId: "non-existent",
        social: false,
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(UserNotFoundError);
    });
  });
});
