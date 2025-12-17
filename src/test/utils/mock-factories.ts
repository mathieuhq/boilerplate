import { vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import type { IEmailProviderPort } from "@/features/email/application/ports/email-provider.port";
import type { IPaymentProviderPort } from "@/features/payment/application/ports/payment-provider.port";
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
    findByStripeCustomerId: vi.fn(),
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
    listUsers: vi.fn(),
    createUser: vi.fn(),
    removeUser: vi.fn(),
    setUserRole: vi.fn(),
    setUserPassword: vi.fn(),
    getRequiredUser: vi.fn(),
    getActiveSubscriptions: vi.fn(),
  };
}

export function createMockPaymentProvider(): IPaymentProviderPort {
  return {
    upgradeSubscription: vi.fn(),
    restoreSubscription: vi.fn(),
    getBillingPortalUrl: vi.fn(),
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
