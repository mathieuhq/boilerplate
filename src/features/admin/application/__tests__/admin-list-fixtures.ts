import type {
  AdminAuditLog,
  AdminOrganizationListItem,
  AdminUserListItem,
} from "../../domain/repositories/admin.repository.interface";

export function createAdminUser(id: string): AdminUserListItem {
  return {
    id,
    name: `User ${id}`,
    email: `${id}@example.com`,
    role: "user",
    banned: false,
    banReason: null,
    banExpires: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null,
    emailVerified: true,
    activeSessionsCount: 0,
  };
}

export function createAdminOrganization(id: string): AdminOrganizationListItem {
  return {
    id,
    name: `Organization ${id}`,
    slug: id,
    createdAt: "2026-01-01T00:00:00.000Z",
    owner: null,
    membersCount: 1,
    pendingInvitationsCount: 0,
  };
}

export function createAdminAuditLog(id: string): AdminAuditLog {
  return {
    id,
    actorUserId: "admin-1",
    actorType: "user",
    action: "admin.user.banned",
    resourceType: "user",
    resourceId: "user-1",
    organizationId: null,
    metadata: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    actorUser: null,
    organization: null,
  };
}

export async function collectBatches<T>(batches: AsyncIterable<T[]>) {
  const collected: T[][] = [];

  for await (const batch of batches) collected.push(batch);

  return collected;
}
