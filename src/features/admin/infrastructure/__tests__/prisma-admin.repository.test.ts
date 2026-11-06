import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/lib/generated/prisma/client";

import type { ActiveSessionCounter } from "../adapters/active-session-counter";
import { PrismaAdminRepository } from "../repositories/prisma-admin.repository";

describe("PrismaAdminRepository lists", () => {
  let repository: PrismaAdminRepository;
  let mockPrisma: {
    user: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    organization: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    auditLog: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };
  let sessionCounter: ActiveSessionCounter;

  beforeEach(() => {
    mockPrisma = {
      user: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn() },
      organization: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn() },
      auditLog: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn() },
    };
    sessionCounter = {
      countAll: vi.fn(),
      countByUser: vi.fn().mockResolvedValue(new Map([["user-1", 2]])),
    };
    repository = new PrismaAdminRepository(
      mockPrisma as unknown as PrismaClient,
      sessionCounter,
    );
  });

  it("translates the user list query into Prisma arguments", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        name: "Jane",
        role: null,
        email: "jane@example.com",
        banned: null,
        banReason: null,
        banExpires: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        lastLoginAt: null,
        emailVerified: true,
      },
    ]);
    mockPrisma.user.count.mockResolvedValue(41);

    const result = await repository.listUsers({
      page: 2,
      pageSize: 20,
      sort: "lastLoginAt.desc",
      search: "jane",
      role: ["user", "support"],
      banned: false,
      emailVerified: true,
      createdAt: "2026-01-01..",
    });

    const where = {
      AND: [
        { deletedAt: null },
        {
          OR: [
            { name: { contains: "jane", mode: "insensitive" } },
            { email: { contains: "jane", mode: "insensitive" } },
          ],
        },
        {
          OR: [
            { OR: [{ role: null }, { role: "" }, { role: "user" }] },
            { role: "support" },
          ],
        },
        { OR: [{ banned: false }, { banned: null }] },
        { emailVerified: true },
        { createdAt: { gte: new Date("2026-01-01T00:00:00.000Z") } },
      ],
    };

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        skip: 20,
        take: 20,
        orderBy: [
          { lastLoginAt: { sort: "desc", nulls: "last" } },
          { id: "desc" },
        ],
      }),
    );
    expect(mockPrisma.user.count).toHaveBeenCalledWith({ where });
    expect(result).toMatchObject({
      page: 2,
      pageSize: 20,
      total: 41,
      pageCount: 3,
      items: [{ id: "user-1", role: "user", activeSessionsCount: 2 }],
    });
  });

  it("filters banned users only", async () => {
    mockPrisma.user.count.mockResolvedValue(0);

    await repository.listUsers({ page: 1, pageSize: 20, banned: true });

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ deletedAt: null }, { banned: true }] },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("sorts organizations by member count", async () => {
    mockPrisma.organization.count.mockResolvedValue(0);

    await repository.listOrganizations({
      page: 1,
      pageSize: 10,
      sort: "members.desc",
      search: "acme",
    });

    expect(mockPrisma.organization.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: "acme", mode: "insensitive" } },
            { slug: { contains: "acme", mode: "insensitive" } },
          ],
        },
        orderBy: [{ members: { _count: "desc" } }, { id: "desc" }],
        take: 10,
      }),
    );
  });

  it("translates the audit log facets and actor filters", async () => {
    mockPrisma.auditLog.count.mockResolvedValue(0);

    await repository.listAuditLogs({
      page: 1,
      pageSize: 50,
      sort: "action.asc",
      action: ["admin.user.banned"],
      actorType: ["system"],
      resourceType: ["user"],
      actor: "jane",
      createdAt: "..2026-01-31",
    });

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            { action: { in: ["admin.user.banned"] } },
            { actorType: { in: ["system"] } },
            { resourceType: { in: ["user"] } },
            {
              OR: [
                { actorUserId: "jane" },
                {
                  actorUser: {
                    is: {
                      OR: [
                        { name: { contains: "jane", mode: "insensitive" } },
                        { email: { contains: "jane", mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            },
            { createdAt: { lt: new Date("2026-02-01T00:00:00.000Z") } },
          ],
        },
        orderBy: [{ action: "asc" }, { id: "desc" }],
      }),
    );
  });

  it("returns the distinct audit log values", async () => {
    mockPrisma.auditLog.findMany
      .mockResolvedValueOnce([{ action: "admin.user.banned" }])
      .mockResolvedValueOnce([{ actorType: "user" }])
      .mockResolvedValueOnce([{ resourceType: "role" }]);

    await expect(repository.getAuditLogFacets()).resolves.toEqual({
      actions: ["admin.user.banned"],
      actorTypes: ["user"],
      resourceTypes: ["role"],
    });
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ distinct: ["action"] }),
    );
  });
});

describe("PrismaAdminRepository last admin guard", () => {
  const updatedUser = {
    id: "admin-2",
    name: "Admin",
    role: "user",
    email: "admin@example.com",
    banned: false,
    banReason: null,
    banExpires: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    lastLoginAt: null,
    emailVerified: true,
  };
  let tx: {
    $queryRaw: ReturnType<typeof vi.fn>;
    user: { update: ReturnType<typeof vi.fn> };
    oauthRefreshToken: { updateMany: ReturnType<typeof vi.fn> };
    oauthAccessToken: { updateMany: ReturnType<typeof vi.fn> };
  };
  let repository: PrismaAdminRepository;

  beforeEach(() => {
    tx = {
      $queryRaw: vi.fn(),
      user: { update: vi.fn().mockResolvedValue(updatedUser) },
      oauthRefreshToken: { updateMany: vi.fn() },
      oauthAccessToken: { updateMany: vi.fn() },
    };
    repository = new PrismaAdminRepository(
      {
        $transaction: vi.fn(async (run: (client: typeof tx) => unknown) =>
          run(tx),
        ),
      } as unknown as PrismaClient,
      {
        countAll: vi.fn(),
        countByUser: vi.fn().mockResolvedValue(new Map()),
      },
    );
  });

  it("refuses to demote the last active admin inside the transaction", async () => {
    tx.$queryRaw.mockResolvedValue([{ id: "admin-2" }]);

    await expect(
      repository.setUserRole({ userId: "admin-2", role: "user" }),
    ).resolves.toBeNull();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("demotes an admin when another active admin remains", async () => {
    tx.$queryRaw.mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }]);

    const user = await repository.setUserRole({
      userId: "admin-2",
      role: "user",
    });

    expect(user?.id).toBe("admin-2");
    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { role: "user" } }),
    );
  });

  it("promotes to admin without locking admins", async () => {
    await repository.setUserRole({ userId: "admin-2", role: "admin" });

    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.user.update).toHaveBeenCalledTimes(1);
  });

  it("refuses to ban the last active admin", async () => {
    tx.$queryRaw.mockResolvedValue([{ id: "admin-2" }]);

    await expect(repository.banUser({ userId: "admin-2" })).resolves.toBeNull();
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it("bans a user who is not an active admin", async () => {
    tx.$queryRaw.mockResolvedValue([{ id: "admin-1" }]);

    await repository.banUser({ userId: "user-1", reason: "spam" });

    expect(tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { banned: true, banReason: "spam", banExpires: null },
      }),
    );
    expect(tx.oauthRefreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revoked: null },
      data: { revoked: expect.any(Date) },
    });
    expect(tx.oauthAccessToken.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revoked: null },
      data: { revoked: expect.any(Date) },
    });
  });
});
