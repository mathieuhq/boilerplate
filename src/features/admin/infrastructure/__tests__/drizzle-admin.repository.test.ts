import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/lib/db";
import {
  auditLog,
  invitation,
  member,
  oauthAccessToken,
  oauthClient,
  oauthRefreshToken,
  organization,
  user,
} from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import type { ActiveSessionCounter } from "../adapters/active-session-counter";
import { DrizzleAdminRepository } from "../repositories/drizzle-admin.repository";

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

const userRow = (
  id: string,
  values: Partial<typeof user.$inferInsert> = {},
) => ({
  id,
  name: id,
  email: `${id}@example.com`,
  createdAt: date("2026-01-01"),
  ...values,
});

describe("DrizzleAdminRepository", () => {
  let db: Database;
  let sessionCounter: ActiveSessionCounter;
  let repository: DrizzleAdminRepository;

  beforeAll(async () => {
    db = await createTestDatabase();
  });

  beforeEach(async () => {
    await db.delete(oauthAccessToken);
    await db.delete(oauthRefreshToken);
    await db.delete(oauthClient);
    await db.delete(auditLog);
    await db.delete(invitation);
    await db.delete(member);
    await db.delete(organization);
    await db.delete(user);
    sessionCounter = {
      countAll: vi.fn().mockResolvedValue(3),
      countByUser: vi.fn(
        async (ids: string[]) => new Map(ids.map((id) => [id, 2])),
      ),
    };
    repository = new DrizzleAdminRepository(db, sessionCounter);
  });

  describe("lists", () => {
    it("filters, searches, sorts and paginates users", async () => {
      await db.insert(user).values([
        userRow("jane-a", {
          name: "Jane A",
          emailVerified: true,
          lastLoginAt: date("2026-03-01"),
        }),
        userRow("jane-b", {
          name: "Jane B",
          role: "",
          emailVerified: true,
          banned: null,
          lastLoginAt: date("2026-04-01"),
        }),
        userRow("jane-c", {
          name: "Jane C",
          role: "support",
          emailVerified: true,
        }),
        userRow("jane-old", {
          name: "Jane Old",
          emailVerified: true,
          createdAt: date("2025-12-31"),
        }),
        userRow("jane-banned", {
          name: "Jane Banned",
          emailVerified: true,
          banned: true,
        }),
        userRow("jane-unverified", { name: "Jane Unverified" }),
        userRow("jane-admin", {
          name: "Jane Admin",
          role: "admin",
          emailVerified: true,
        }),
        userRow("jane-deleted", {
          name: "Jane Deleted",
          emailVerified: true,
          deletedAt: date("2026-02-01"),
        }),
        userRow("bob", { emailVerified: true }),
      ]);

      const query = {
        pageSize: 2,
        sort: "lastLoginAt.desc" as const,
        search: "JANE",
        role: ["user", "support"],
        banned: false,
        emailVerified: true,
        createdAt: "2026-01-01..",
      };
      const first = await repository.listUsers({ ...query, page: 1 });
      const second = await repository.listUsers({ ...query, page: 2 });

      expect(first).toMatchObject({
        page: 1,
        pageSize: 2,
        total: 3,
        pageCount: 2,
        items: [
          { id: "jane-b", role: "user", banned: false, activeSessionsCount: 2 },
          {
            id: "jane-a",
            role: "user",
            lastLoginAt: "2026-03-01T00:00:00.000Z",
          },
        ],
      });
      expect(second.items.map((item) => item.id)).toEqual(["jane-c"]);
      expect(second.items[0]).toMatchObject({
        role: "support",
        lastLoginAt: null,
      });
    });

    it("filters banned users only, newest first", async () => {
      await db.insert(user).values([
        userRow("banned-old", { banned: true }),
        userRow("banned-new", {
          banned: true,
          createdAt: date("2026-02-01"),
        }),
        userRow("active"),
        userRow("banned-deleted", {
          banned: true,
          deletedAt: date("2026-02-01"),
        }),
      ]);

      const result = await repository.listUsers({
        page: 1,
        pageSize: 20,
        banned: true,
      });

      expect(result.total).toBe(2);
      expect(result.items.map((item) => item.id)).toEqual([
        "banned-new",
        "banned-old",
      ]);
    });

    it("sorts organizations by member count with owners and pending invitations", async () => {
      await db
        .insert(user)
        .values([userRow("owner-1"), userRow("owner-2"), userRow("member-1")]);
      await db.insert(organization).values([
        { id: "org-1", name: "Acme One", slug: "one" },
        { id: "org-2", name: "Two", slug: "acme-two" },
        { id: "org-3", name: "Other", slug: "other" },
        { id: "org-4", name: "Acme Empty", slug: "empty" },
      ]);
      await db.insert(member).values([
        { organizationId: "org-1", userId: "owner-1", role: "owner" },
        { organizationId: "org-2", userId: "owner-2", role: "owner" },
        { organizationId: "org-2", userId: "member-1", role: "member" },
        { organizationId: "org-3", userId: "owner-1", role: "owner" },
        { organizationId: "org-3", userId: "owner-2", role: "member" },
        { organizationId: "org-3", userId: "member-1", role: "member" },
      ]);
      await db.insert(invitation).values([
        {
          organizationId: "org-2",
          email: "a@example.com",
          role: "member",
          status: "pending",
          inviterId: "owner-2",
          expiresAt: date("2026-12-01"),
        },
        {
          organizationId: "org-2",
          email: "b@example.com",
          role: "member",
          status: "accepted",
          inviterId: "owner-2",
          expiresAt: date("2026-12-01"),
        },
      ]);

      const result = await repository.listOrganizations({
        page: 1,
        pageSize: 10,
        sort: "members.desc",
        search: "acme",
      });

      expect(result.total).toBe(3);
      expect(result.items).toMatchObject([
        {
          id: "org-2",
          membersCount: 2,
          pendingInvitationsCount: 1,
          owner: { id: "owner-2", email: "owner-2@example.com" },
        },
        { id: "org-1", membersCount: 1, pendingInvitationsCount: 0 },
        { id: "org-4", membersCount: 0, owner: null },
      ]);
    });

    it("filters audit logs by facets, actor and date range", async () => {
      await db
        .insert(user)
        .values([
          userRow("jane", { name: "Jane Doe" }),
          userRow("bob", { email: "bob@jane.dev" }),
          userRow("eve"),
        ]);
      await db
        .insert(organization)
        .values({ id: "org-1", name: "Acme", slug: "acme" });
      const base = {
        actorType: "user",
        resourceType: "user",
        action: "admin.user.banned",
        createdAt: date("2026-01-15"),
      };
      await db.insert(auditLog).values([
        {
          ...base,
          id: "log-jane",
          actorUserId: "jane",
          organizationId: "org-1",
        },
        { ...base, id: "log-bob", actorUserId: "bob", action: "admin.user.a" },
        { ...base, id: "log-eve", actorUserId: "eve" },
        {
          ...base,
          id: "log-late",
          actorUserId: "jane",
          createdAt: date("2026-02-01"),
        },
        { ...base, id: "log-system", actorType: "system" },
        { ...base, id: "log-role", actorUserId: "jane", resourceType: "role" },
      ]);

      const result = await repository.listAuditLogs({
        page: 1,
        pageSize: 50,
        sort: "action.asc",
        action: ["admin.user.banned", "admin.user.a"],
        actorType: ["user"],
        resourceType: ["user"],
        actor: "jane",
        createdAt: "..2026-01-31",
      });

      expect(result.total).toBe(2);
      expect(result.items).toMatchObject([
        { id: "log-bob", actorUser: { id: "bob" }, organization: null },
        {
          id: "log-jane",
          actorUser: {
            id: "jane",
            name: "Jane Doe",
            email: "jane@example.com",
          },
          organization: { id: "org-1", name: "Acme", slug: "acme" },
        },
      ]);
      await expect(
        repository.listAuditLogs({ page: 1, pageSize: 50, actor: "eve" }),
      ).resolves.toMatchObject({ total: 1, items: [{ id: "log-eve" }] });
      await expect(
        repository.listAuditLogs({ page: 1, pageSize: 50, search: "acm" }),
      ).resolves.toMatchObject({ total: 1, items: [{ id: "log-jane" }] });
    });

    it("returns the distinct audit log values", async () => {
      await db.insert(auditLog).values([
        { actorType: "user", action: "b.action", resourceType: "role" },
        { actorType: "user", action: "a.action", resourceType: "role" },
        { actorType: "system", action: "a.action", resourceType: "user" },
      ]);

      await expect(repository.getAuditLogFacets()).resolves.toEqual({
        actions: ["a.action", "b.action"],
        actorTypes: ["system", "user"],
        resourceTypes: ["role", "user"],
      });
    });
  });

  describe("details", () => {
    it("returns the overview metrics", async () => {
      await db
        .insert(user)
        .values([
          userRow("recent", { createdAt: new Date(), banned: true }),
          userRow("old"),
          userRow("deleted", { createdAt: new Date(), deletedAt: new Date() }),
        ]);
      await db
        .insert(organization)
        .values({ id: "org-1", name: "Acme", slug: "acme" });
      await db.insert(invitation).values({
        organizationId: "org-1",
        email: "a@example.com",
        role: "member",
        status: "pending",
        inviterId: "old",
        expiresAt: date("2026-12-01"),
      });

      await expect(repository.getOverviewMetrics()).resolves.toEqual({
        totalUsers: 2,
        newUsersLast7Days: 1,
        newUsersLast30Days: 1,
        totalOrganizations: 1,
        pendingInvitations: 1,
        bannedUsers: 1,
        activeSessions: 3,
      });
    });

    it("returns an organization with every member and invitation", async () => {
      await db
        .insert(user)
        .values([userRow("owner"), userRow("admin"), userRow("member")]);
      await db
        .insert(organization)
        .values({ id: "org-1", name: "Acme", slug: "acme" });
      await db.insert(member).values([
        {
          id: "m-1",
          organizationId: "org-1",
          userId: "member",
          role: "member",
        },
        { id: "m-2", organizationId: "org-1", userId: "owner", role: "owner" },
        { id: "m-3", organizationId: "org-1", userId: "admin", role: "admin" },
      ]);
      await db.insert(invitation).values([
        {
          id: "i-1",
          organizationId: "org-1",
          email: "a@example.com",
          role: "member",
          status: "accepted",
          inviterId: "owner",
          expiresAt: date("2026-12-01"),
          createdAt: date("2026-01-01"),
        },
        {
          id: "i-2",
          organizationId: "org-1",
          email: "b@example.com",
          role: "member",
          status: "pending",
          inviterId: "owner",
          expiresAt: date("2026-12-01"),
          createdAt: date("2026-01-02"),
        },
      ]);

      const details = await repository.getOrganizationDetails({
        organizationId: "org-1",
      });

      expect(details).toMatchObject({
        id: "org-1",
        membersCount: 3,
        pendingInvitationsCount: 1,
        owner: { id: "owner", name: "owner", email: "owner@example.com" },
        invitations: [
          { id: "i-2", expiresAt: "2026-12-01T00:00:00.000Z" },
          { id: "i-1" },
        ],
      });
      expect(details?.members.map((row) => row.id)).toEqual([
        "m-2",
        "m-1",
        "m-3",
      ]);
      await expect(
        repository.getOrganizationDetails({ organizationId: "missing" }),
      ).resolves.toBeNull();
    });

    it("creates an audit log with its relations", async () => {
      await db.insert(user).values(userRow("jane"));

      await expect(
        repository.createAuditLog({
          actorType: "user",
          actorUserId: "jane",
          action: "admin.user.banned",
          resourceType: "user",
          resourceId: "bob",
          metadata: { reason: "spam" },
        }),
      ).resolves.toMatchObject({
        actorUser: { id: "jane", name: "jane", email: "jane@example.com" },
        organization: null,
        organizationId: null,
        metadata: { reason: "spam" },
      });
      await expect(
        repository.createAuditLog({
          actorType: "system",
          action: "system.cleanup",
          resourceType: "user",
        }),
      ).resolves.toMatchObject({ actorUser: null, metadata: null });
    });

    it("returns the user security state", async () => {
      await db.insert(user).values(userRow("jane", { banned: null }));

      await expect(repository.getUserSecurityState("jane")).resolves.toEqual({
        id: "jane",
        role: "user",
        banned: false,
      });
      await expect(
        repository.getUserSecurityState("missing"),
      ).resolves.toBeNull();
    });
  });

  describe("last admin guard", () => {
    const roleOf = async (id: string) =>
      (await db.query.user.findFirst({ where: eq(user.id, id) }))?.role;

    it("refuses to demote the last active admin", async () => {
      await db
        .insert(user)
        .values([
          userRow("admin-1", { role: "admin", banned: true }),
          userRow("admin-2", { role: "admin" }),
          userRow("admin-3", { role: "admin", deletedAt: new Date() }),
        ]);

      await expect(
        repository.setUserRole({ userId: "admin-2", role: "user" }),
      ).resolves.toBeNull();
      expect(await roleOf("admin-2")).toBe("admin");
    });

    it("demotes an admin when another active admin remains", async () => {
      await db
        .insert(user)
        .values([
          userRow("admin-1", { role: "admin" }),
          userRow("admin-2", { role: "admin" }),
        ]);

      const result = await repository.setUserRole({
        userId: "admin-2",
        role: "user",
      });

      expect(result).toMatchObject({
        id: "admin-2",
        role: "user",
        activeSessionsCount: 2,
      });
      expect(await roleOf("admin-2")).toBe("user");
    });

    it("promotes the only user to admin", async () => {
      await db.insert(user).values(userRow("user-1"));

      await expect(
        repository.setUserRole({ userId: "user-1", role: "admin" }),
      ).resolves.toMatchObject({ role: "admin" });
    });

    it("refuses to ban the last active admin", async () => {
      await db.insert(user).values(userRow("admin-2", { role: "admin" }));

      await expect(
        repository.banUser({ userId: "admin-2" }),
      ).resolves.toBeNull();
      expect(
        (await db.query.user.findFirst({ where: eq(user.id, "admin-2") }))
          ?.banned,
      ).toBe(false);
    });

    it("bans a user, revokes their OAuth tokens and unbans them", async () => {
      await db
        .insert(user)
        .values([userRow("admin-1", { role: "admin" }), userRow("user-1")]);
      await db.insert(oauthClient).values({ id: "client", clientId: "client" });
      const revokedAt = date("2026-01-01");
      const token = (
        id: string,
        userId: string,
        revoked: Date | null = null,
      ) => ({
        id,
        token: id,
        clientId: "client",
        userId,
        revoked,
        expiresAt: date("2027-01-01"),
      });
      await db
        .insert(oauthRefreshToken)
        .values([
          token("refresh-1", "user-1"),
          token("refresh-2", "user-1", revokedAt),
          token("refresh-3", "admin-1"),
        ]);
      await db
        .insert(oauthAccessToken)
        .values([token("access-1", "user-1"), token("access-2", "admin-1")]);

      const expiresAt = date("2026-06-01");
      await expect(
        repository.banUser({ userId: "user-1", reason: "spam", expiresAt }),
      ).resolves.toMatchObject({
        id: "user-1",
        banned: true,
        banReason: "spam",
        banExpires: expiresAt.toISOString(),
      });

      const refresh = await db.select().from(oauthRefreshToken);
      const access = await db.select().from(oauthAccessToken);
      const revokedById = Object.fromEntries(
        [...refresh, ...access].map((row) => [row.id, row.revoked]),
      );

      expect(revokedById["refresh-1"]).toBeInstanceOf(Date);
      expect(revokedById["refresh-2"]).toEqual(revokedAt);
      expect(revokedById["refresh-3"]).toBeNull();
      expect(revokedById["access-1"]).toBeInstanceOf(Date);
      expect(revokedById["access-2"]).toBeNull();

      await expect(
        repository.unbanUser({ userId: "user-1" }),
      ).resolves.toMatchObject({
        banned: false,
        banReason: null,
        banExpires: null,
      });
    });

    it("throws when the updated user does not exist", async () => {
      await expect(
        repository.unbanUser({ userId: "missing" }),
      ).rejects.toThrow();
    });
  });
});
