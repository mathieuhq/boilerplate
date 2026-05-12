import { vi } from "vitest";

import type { IAdminRepository } from "../../domain/repositories/admin.repository.interface";

export function createMockAdminRepository(): IAdminRepository {
  return {
    banUser: vi.fn(),
    listUsers: vi.fn(),
    unbanUser: vi.fn(),
    setUserRole: vi.fn(),
    listAuditLogs: vi.fn(),
    createAuditLog: vi.fn(),
    countActiveAdmins: vi.fn(),
    listOrganizations: vi.fn(),
    getOverviewMetrics: vi.fn(),
    getUserSecurityState: vi.fn(),
    getRegistrationsByDay: vi.fn(),
    getOrganizationDetails: vi.fn(),
  };
}
