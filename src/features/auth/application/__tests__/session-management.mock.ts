import { vi } from "vitest";

import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";

import type { AuthSession } from "../ports/auth-provider.port";
import type {
  ISessionManagementPort,
  UserSessionRecord,
} from "../ports/session-management.port";

export function createMockSessionManagement(): ISessionManagementPort {
  return {
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
    revokeOtherSessions: vi.fn(),
  };
}

export function createMockAuditLog(): IAuditLogPort {
  return { record: vi.fn() };
}

export function createAuthSession(
  overrides: Partial<AuthSession["session"]> = {},
): AuthSession {
  return {
    user: { id: "user-1", name: "Ada", email: "ada@example.com" },
    session: {
      id: "session-current",
      userId: "user-1",
      expiresAt: new Date("2099-01-01"),
      activeOrganizationId: null,
      impersonatedBy: null,
      ...overrides,
    },
  };
}

export function createSessionRecord(
  overrides: Partial<UserSessionRecord> = {},
): UserSessionRecord {
  return {
    id: "session-current",
    token: "token-current",
    userId: "user-1",
    ipAddress: "203.0.113.10",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    createdAt: new Date("2026-10-01T10:00:00.000Z"),
    updatedAt: new Date("2026-11-01T10:00:00.000Z"),
    expiresAt: new Date("2099-01-01T00:00:00.000Z"),
    impersonatedBy: null,
    ...overrides,
  };
}
