import { vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import type { IEmailProviderPort } from "@/features/email/application/ports/email-provider.port";
import type { IOrganizationRepository } from "@/features/organization/domain/repositories/organization.repository.interface";
import type { IAuthProviderPort as IUserAuthProviderPort } from "@/features/user/application/ports/auth-provider.port";
import type { IEmailNotifierPort } from "@/features/user/application/ports/email-notifier.port";
import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";

export function createMockUserRepository(): IUserRepository {
  return {
    save: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    isEmailTaken: vi.fn(),
  };
}

export function createMockEmailProvider(): IEmailProviderPort {
  return {
    send: vi.fn(),
    subscribeContact: vi.fn(),
    unsubscribeContact: vi.fn(),
  };
}

export function createMockAuthProvider(): IAuthProviderPort {
  return {
    getUser: vi.fn(),
    getSession: vi.fn(),
    setUserRole: vi.fn(),
    getRequiredUser: vi.fn(),
  };
}

export function createMockEmailNotifier(): IEmailNotifierPort {
  return {
    subscribeContact: vi.fn(),
    unsubscribeContact: vi.fn(),
  };
}

export function createMockUserAuthProvider(): IUserAuthProviderPort {
  return {
    getUser: vi.fn(),
    getRequiredUser: vi.fn(),
  };
}

export function createMockOrganizationRepository(): IOrganizationRepository {
  return {
    findByUserIdWithAdminRole: vi.fn(),
  };
}
