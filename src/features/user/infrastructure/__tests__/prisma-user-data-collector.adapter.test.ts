import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "@/lib/generated/prisma/client";

import {
  PrismaUserDataCollectorAdapter,
  USER_DATA_SELECTS,
} from "../adapters/prisma-user-data-collector.adapter";

const SECRETS = {
  password: "argon2id$secret-password-hash",
  accessToken: "oauth-access-token-secret",
  refreshToken: "oauth-refresh-token-secret",
  idToken: "oauth-id-token-secret",
  sessionToken: "session-token-secret",
  publicKey: "passkey-public-key-secret",
  credentialID: "passkey-credential-secret",
  ipHash: "ip-hash-secret",
};

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-02-01T00:00:00.000Z");
const organization = { id: "org-1", name: "Acme", slug: "acme", logo: "x" };

function createPrisma() {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: "user-1",
        name: "Ada",
        email: "ada@example.com",
        emailVerified: true,
        image: "user-avatars/avatar.webp",
        language: "EN",
        birthDate: new Date("1990-05-06T00:00:00.000Z"),
        role: "user",
        banned: null,
        banReason: null,
        banExpires: null,
        communicationEmails: true,
        marketingEmails: false,
        socialEmails: true,
        securityEmails: true,
        notificationType: "ALL",
        createdAt,
        updatedAt,
        lastLoginAt: null,
        emailContactId: "contact-secret",
      }),
    },
    account: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "account-1",
          providerId: "github",
          accountId: "gh-1",
          scope: "read:user",
          createdAt,
          updatedAt,
          accessToken: SECRETS.accessToken,
          refreshToken: SECRETS.refreshToken,
          idToken: SECRETS.idToken,
          password: SECRETS.password,
        },
      ]),
    },
    session: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "session-1",
          ipAddress: "203.0.113.1",
          userAgent: "Firefox",
          activeOrganizationId: "org-1",
          impersonatedBy: "admin-1",
          createdAt,
          updatedAt,
          expiresAt: updatedAt,
          token: SECRETS.sessionToken,
        },
      ]),
    },
    passkey: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "passkey-1",
          name: "MacBook",
          deviceType: "multiDevice",
          backedUp: true,
          transports: "internal",
          aaguid: "aaguid-1",
          createdAt: null,
          publicKey: SECRETS.publicKey,
          credentialID: SECRETS.credentialID,
          counter: 4,
        },
      ]),
    },
    member: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          { id: "member-1", role: "owner", createdAt, organization },
        ]),
    },
    invitation: {
      findMany: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "invitation-1",
            email: "ada@example.com",
            role: "member",
            status: "pending",
            expiresAt: updatedAt,
            createdAt,
            organization,
          },
        ])
        .mockResolvedValueOnce([]),
    },
    notification: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "notification-1",
          type: "system.message",
          data: { title: "Hello" },
          link: null,
          readAt: updatedAt,
          createdAt,
        },
      ]),
    },
    auditLog: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "audit-1",
          action: "user.data_export.requested",
          actorType: "user",
          actorUserId: "user-1",
          resourceType: "data_export",
          resourceId: "export-1",
          organizationId: null,
          metadata: null,
          createdAt,
          ipHash: SECRETS.ipHash,
        },
      ]),
    },
    oauthConsent: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "consent-1",
          clientId: "client-1",
          scopes: ["openid"],
          createdAt,
          updatedAt,
          client: { name: "CLI" },
        },
      ]),
    },
  };
}

describe("PrismaUserDataCollectorAdapter", () => {
  let prisma: ReturnType<typeof createPrisma>;
  let collector: PrismaUserDataCollectorAdapter;

  beforeEach(() => {
    prisma = createPrisma();
    collector = new PrismaUserDataCollectorAdapter(
      prisma as unknown as PrismaClient,
    );
  });

  it("returns null when the user does not exist", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(collector.collect("user-1")).resolves.toBeNull();
    expect(prisma.account.findMany).not.toHaveBeenCalled();
  });

  it("collects every category of personal data", async () => {
    const snapshot = await collector.collect("user-1");

    expect(snapshot?.profile).toMatchObject({
      id: "user-1",
      email: "ada@example.com",
      birthDate: "1990-05-06T00:00:00.000Z",
      banned: false,
      emailPreferences: { marketing: false },
    });
    expect(snapshot?.accounts).toEqual([
      {
        id: "account-1",
        providerId: "github",
        accountId: "gh-1",
        scope: "read:user",
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    ]);
    expect(snapshot?.sessions[0]).toMatchObject({
      ipAddress: "203.0.113.1",
      impersonated: true,
    });
    expect(snapshot?.passkeys[0]).toMatchObject({
      name: "MacBook",
      createdAt: null,
    });
    expect(snapshot?.memberships[0].organization).toEqual({
      id: "org-1",
      name: "Acme",
      slug: "acme",
    });
    expect(snapshot?.invitations.received).toHaveLength(1);
    expect(snapshot?.invitations.sent).toEqual([]);
    expect(snapshot?.notifications[0].data).toEqual({ title: "Hello" });
    expect(snapshot?.auditLogs[0]).toMatchObject({
      action: "user.data_export.requested",
      metadata: null,
    });
    expect(snapshot?.connectedApps[0]).toMatchObject({
      clientName: "CLI",
      scopes: ["openid"],
    });
    expect(snapshot?.storedFiles).toEqual([
      { key: "user-avatars/avatar.webp", purpose: "avatar" },
    ]);
  });

  it("never exports secrets, even if the database returns them", async () => {
    const serialized = JSON.stringify(await collector.collect("user-1"));

    for (const secret of [...Object.values(SECRETS), "contact-secret"])
      expect(serialized).not.toContain(secret);
  });

  it("never selects secret columns", () => {
    const selects = JSON.stringify(USER_DATA_SELECTS);

    for (const column of [
      "password",
      "accessToken",
      "refreshToken",
      "idToken",
      "token",
      "secret",
      "publicKey",
      "credentialID",
      "ipHash",
      "userAgentHash",
    ])
      expect(selects).not.toContain(`"${column}"`);
  });

  it("scopes every query to the user", async () => {
    await collector.collect("user-1");

    expect(prisma.invitation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: "ada@example.com", mode: "insensitive" } },
      }),
    );
    expect(prisma.invitation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { inviterId: "user-1" } }),
    );
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { actorUserId: "user-1" },
            { resourceType: "user", resourceId: "user-1" },
          ],
        },
      }),
    );
  });

  it("only lists files stored in managed buckets", async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...(await prisma.user.findUnique()),
      image: "https://avatars.githubusercontent.com/u/1",
    });

    const snapshot = await collector.collect("user-1");

    expect(snapshot?.storedFiles).toEqual([]);
    expect(snapshot?.profile.image).toBe(
      "https://avatars.githubusercontent.com/u/1",
    );
  });
});
