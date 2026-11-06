import { vi } from "vitest";

import type { DataExport } from "../../domain/entities/data-export.types";
import type { IDataExportRepository } from "../../domain/repositories/data-export.repository.interface";
import type { UserDataSnapshot } from "../dto/user-data-snapshot.dto";
import type { IUserAuditLogPort } from "../ports/audit-log.port";
import type { IDataExportStoragePort } from "../ports/data-export-storage.port";

export const NOW = new Date("2026-11-02T12:00:00.000Z");

export function createMockDataExportRepository(): IDataExportRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findLatestByUserId: vi.fn(),
    markReady: vi.fn(),
    markFailed: vi.fn(),
    findExpired: vi.fn(),
    deleteMany: vi.fn(),
  };
}

export function createMockDataExportStorage(): IDataExportStoragePort {
  return {
    upload: vi.fn().mockResolvedValue(undefined),
    download: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    getDownloadUrl: vi.fn().mockResolvedValue("https://s3.example.com/x"),
  };
}

export function createMockAuditLog(): IUserAuditLogPort {
  return { record: vi.fn().mockResolvedValue(undefined) };
}

export function buildDataExport(
  overrides: Partial<DataExport> = {},
): DataExport {
  return {
    id: "export-1",
    userId: "user-1",
    status: "pending",
    fileKey: null,
    size: null,
    createdAt: new Date("2026-11-02T10:00:00.000Z"),
    completedAt: null,
    expiresAt: new Date("2026-11-09T10:00:00.000Z"),
    ...overrides,
  };
}

export function buildSnapshot(
  overrides: Partial<UserDataSnapshot> = {},
): UserDataSnapshot {
  return {
    profile: {
      id: "user-1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      emailVerified: true,
      image: "user-avatars/avatar-1.webp",
      language: "FR",
      birthDate: null,
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      emailPreferences: {
        communication: true,
        marketing: false,
        social: true,
        security: true,
      },
      notificationType: "ALL",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
      lastLoginAt: null,
    },
    accounts: [],
    sessions: [],
    passkeys: [],
    memberships: [],
    invitations: { received: [], sent: [] },
    notifications: [],
    auditLogs: [],
    connectedApps: [],
    storedFiles: [{ key: "user-avatars/avatar-1.webp", purpose: "avatar" }],
    ...overrides,
  };
}
