import { vi } from "vitest";

import type { IAuthProviderPort } from "@/features/auth/application/ports/auth-provider.port";
import type { IEmailProviderPort } from "@/features/email/application/ports/email-provider.port";
import type { IOrganizationManagementPort } from "@/features/organization/application/ports/organization-management.port";
import type { IOrganizationRepository } from "@/features/organization/domain/repositories/organization.repository.interface";
import type { IAuthProviderPort as IUserAuthProviderPort } from "@/features/user/application/ports/auth-provider.port";
import type { IEmailNotifierPort } from "@/features/user/application/ports/email-notifier.port";
import type { IUserRepository } from "@/features/user/domain/repositories/user.repository.interface";
import type { ICachePort } from "@/shared/application/ports/cache.port";
import type { CacheStore } from "@/shared/infrastructure/cache/redis-cache.adapter";

export function createMockCache(): ICachePort {
  return {
    getOrSet: vi.fn((_key, _ttlSeconds, load) => load()),
    delete: vi.fn(),
  };
}

export function createMemoryCacheStore() {
  const data = new Map<string, string>();

  const store = {
    get: vi.fn<CacheStore["get"]>(async (key) => data.get(key) ?? null),
    set: vi.fn<CacheStore["set"]>(async (key, value) => {
      data.set(key, value);
      return "OK";
    }),
    del: vi.fn<CacheStore["del"]>(async (...keys) => {
      keys.forEach((key) => data.delete(key));
      return keys.length;
    }),
  } satisfies CacheStore;

  return Object.assign(store, { data });
}

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
    deleteContact: vi.fn(),
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
    revokeUserSessions: vi.fn(),
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
    findManageableByUser: vi.fn(),
  };
}

export function createMockOrganizationManagement(): IOrganizationManagementPort {
  return {
    listMembers: vi.fn(),
    inviteMember: vi.fn(),
    removeMember: vi.fn(),
    listInvitations: vi.fn(),
    cancelInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
    listOrganizations: vi.fn(),
    updateOrganization: vi.fn(),
    createOrganization: vi.fn(),
    setActiveOrganization: vi.fn(),
  };
}
