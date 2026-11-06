import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import {
  account,
  auditLog,
  invitation,
  member,
  notification,
  oauthClient,
  oauthConsent,
  organization,
  passkey,
  session,
  user,
} from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import {
  DrizzleUserDataCollectorAdapter,
  USER_DATA_SELECTS,
} from "../adapters/drizzle-user-data-collector.adapter";

const SECRETS = {
  password: "argon2id$secret-password-hash",
  accessToken: "oauth-access-token-secret",
  refreshToken: "oauth-refresh-token-secret",
  idToken: "oauth-id-token-secret",
  sessionToken: "session-token-secret",
  publicKey: "passkey-public-key-secret",
  credentialID: "passkey-credential-secret",
  ipHash: "ip-hash-secret",
  clientSecret: "oauth-client-secret",
};

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-02-01T00:00:00.000Z");

async function seed(db: Database) {
  await db.insert(user).values([
    {
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
      emailVerified: true,
      image: "user-avatars/avatar.webp",
      language: "EN",
      birthDate: new Date("1990-05-06T00:00:00.000Z"),
      role: "user",
      banned: null,
      marketingEmails: false,
      notificationType: "ALL",
      createdAt,
      updatedAt,
      emailContactId: "contact-secret",
    },
    {
      id: "user-2",
      name: "Grace",
      email: "grace@example.com",
      createdAt,
      updatedAt,
    },
  ]);
  await db.insert(organization).values({
    id: "org-1",
    name: "Acme",
    slug: "acme",
    logo: "x",
    createdAt,
  });
  await db.insert(account).values([
    {
      id: "account-1",
      userId: "user-1",
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
    {
      id: "account-2",
      userId: "user-2",
      providerId: "github",
      accountId: "gh-2",
      updatedAt,
    },
  ]);
  await db.insert(session).values({
    id: "session-1",
    userId: "user-1",
    token: SECRETS.sessionToken,
    ipAddress: "203.0.113.1",
    userAgent: "Firefox",
    activeOrganizationId: "org-1",
    impersonatedBy: "admin-1",
    createdAt,
    updatedAt,
    expiresAt: updatedAt,
  });
  await db.insert(passkey).values({
    id: "passkey-1",
    userId: "user-1",
    name: "MacBook",
    deviceType: "multiDevice",
    backedUp: true,
    transports: "internal",
    aaguid: "aaguid-1",
    createdAt: null,
    publicKey: SECRETS.publicKey,
    credentialID: SECRETS.credentialID,
    counter: 4,
  });
  await db.insert(member).values({
    id: "member-1",
    organizationId: "org-1",
    userId: "user-1",
    role: "owner",
    createdAt,
  });
  await db.insert(invitation).values([
    {
      id: "invitation-1",
      organizationId: "org-1",
      email: "ADA@example.com",
      role: "member",
      status: "pending",
      expiresAt: updatedAt,
      inviterId: "user-2",
      createdAt,
    },
    {
      id: "invitation-2",
      organizationId: "org-1",
      email: "ada@example.com.evil",
      role: "member",
      status: "pending",
      expiresAt: updatedAt,
      inviterId: "user-2",
      createdAt: new Date("2025-12-01T00:00:00.000Z"),
    },
  ]);
  await db.insert(notification).values({
    id: "notification-1",
    userId: "user-1",
    type: "system.message",
    data: { title: "Hello" },
    readAt: updatedAt,
    createdAt,
  });
  await db.insert(auditLog).values([
    {
      id: "audit-1",
      action: "user.data_export.requested",
      actorType: "user",
      actorUserId: "user-1",
      resourceType: "data_export",
      resourceId: "export-1",
      createdAt,
      ipHash: SECRETS.ipHash,
    },
    {
      id: "audit-2",
      action: "admin.users.banned",
      actorType: "user",
      actorUserId: "user-2",
      resourceType: "user",
      resourceId: "user-1",
      createdAt: updatedAt,
    },
    {
      id: "audit-3",
      action: "admin.users.banned",
      actorType: "user",
      actorUserId: "user-2",
      resourceType: "organization",
      resourceId: "user-1",
      createdAt,
    },
  ]);
  await db.insert(oauthClient).values({
    id: "oauth-client-1",
    clientId: "client-1",
    clientSecret: SECRETS.clientSecret,
    name: "CLI",
  });
  await db.insert(oauthConsent).values({
    id: "consent-1",
    clientId: "client-1",
    userId: "user-1",
    scopes: ["openid"],
    createdAt,
    updatedAt,
  });
}

describe("DrizzleUserDataCollectorAdapter", () => {
  let db: Database;
  let collector: DrizzleUserDataCollectorAdapter;

  beforeAll(async () => {
    db = await createTestDatabase();
    await seed(db);
    collector = new DrizzleUserDataCollectorAdapter(db);
  });

  it("returns null when the user does not exist", async () => {
    await expect(collector.collect("missing")).resolves.toBeNull();
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
    expect(snapshot?.sessions).toHaveLength(1);
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
    expect(snapshot?.notifications[0].data).toEqual({ title: "Hello" });
    expect(snapshot?.connectedApps).toEqual([
      {
        id: "consent-1",
        clientId: "client-1",
        clientName: "CLI",
        scopes: ["openid"],
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      },
    ]);
    expect(snapshot?.storedFiles).toEqual([
      { key: "user-avatars/avatar.webp", purpose: "avatar" },
    ]);
  });

  it("matches received invitations by email case-insensitively", async () => {
    const snapshot = await collector.collect("user-1");

    expect(
      snapshot?.invitations.received.map((invitation) => invitation.id),
    ).toEqual(["invitation-1"]);
    expect(snapshot?.invitations.sent).toEqual([]);
    expect(
      (await collector.collect("user-2"))?.invitations.sent.map(
        (invitation) => invitation.id,
      ),
    ).toEqual(["invitation-1", "invitation-2"]);
  });

  it("collects audit logs where the user is the actor or the resource", async () => {
    const snapshot = await collector.collect("user-1");

    expect(snapshot?.auditLogs.map((auditLog) => auditLog.id)).toEqual([
      "audit-2",
      "audit-1",
    ]);
    expect(snapshot?.auditLogs[1]).toMatchObject({
      action: "user.data_export.requested",
      metadata: null,
    });
  });

  it("never exports secrets", async () => {
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

  it("only lists files stored in managed buckets", async () => {
    await db
      .update(user)
      .set({ image: "https://avatars.githubusercontent.com/u/1" })
      .where(eq(user.id, "user-2"));

    const snapshot = await collector.collect("user-2");

    expect(snapshot?.storedFiles).toEqual([]);
    expect(snapshot?.profile.image).toBe(
      "https://avatars.githubusercontent.com/u/1",
    );
  });
});
