import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { dataExport, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import { DrizzleDataExportRepository } from "../repositories/drizzle-data-export.repository";

const expiresAt = new Date("2026-03-01T00:00:00.000Z");

describe("DrizzleDataExportRepository", () => {
  let db: Database;
  let repository: DrizzleDataExportRepository;

  beforeAll(async () => {
    db = await createTestDatabase();
    repository = new DrizzleDataExportRepository(db);
    await db.insert(user).values([
      { id: "user-1", name: "Ada", email: "ada@example.com" },
      { id: "user-2", name: "Grace", email: "grace@example.com" },
    ]);
  });

  it("creates a pending export and finds it by id", async () => {
    const created = await repository.create({ userId: "user-1", expiresAt });

    expect(created).toMatchObject({
      userId: "user-1",
      status: "pending",
      fileKey: null,
      size: null,
      completedAt: null,
      expiresAt,
    });
    await expect(repository.findById(created.id)).resolves.toEqual(created);
    await expect(repository.findById("missing")).resolves.toBeNull();
  });

  it("finds the latest export with one of the given statuses", async () => {
    await db.insert(dataExport).values([
      {
        id: "a",
        userId: "user-2",
        status: "READY",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        expiresAt,
      },
      {
        id: "b",
        userId: "user-2",
        status: "READY",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        expiresAt,
      },
      {
        id: "c",
        userId: "user-2",
        status: "FAILED",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        expiresAt,
      },
    ]);

    await expect(
      repository.findLatestByUserId("user-2", ["ready"]),
    ).resolves.toMatchObject({ id: "b", status: "ready" });
    await expect(
      repository.findLatestByUserId("user-2", ["ready", "failed"]),
    ).resolves.toMatchObject({ id: "c" });
    await expect(
      repository.findLatestByUserId("user-2", ["pending"]),
    ).resolves.toBeNull();
  });

  it("marks an export ready and throws when it does not exist", async () => {
    const created = await repository.create({ userId: "user-1", expiresAt });
    const completedAt = new Date("2026-02-01T00:00:00.000Z");

    await expect(
      repository.markReady(created.id, {
        fileKey: "data-exports/user-1/x.zip",
        size: 42,
        completedAt,
        expiresAt,
      }),
    ).resolves.toMatchObject({
      status: "ready",
      fileKey: "data-exports/user-1/x.zip",
      size: 42,
      completedAt,
    });
    await expect(
      repository.markReady("missing", {
        fileKey: "x",
        size: 1,
        completedAt,
        expiresAt,
      }),
    ).rejects.toThrow();
  });

  it("marks an export failed unless it is already ready", async () => {
    const pending = await repository.create({ userId: "user-1", expiresAt });

    await repository.markFailed(pending.id);
    await repository.markFailed("a");

    await expect(repository.findById(pending.id)).resolves.toMatchObject({
      status: "failed",
    });
    await expect(repository.findById("a")).resolves.toMatchObject({
      status: "ready",
    });
  });

  it("finds expired exports oldest first and deletes them", async () => {
    await db.insert(dataExport).values([
      {
        id: "old-2",
        userId: "user-1",
        expiresAt: new Date("2020-01-02T00:00:00.000Z"),
      },
      {
        id: "old-1",
        userId: "user-1",
        expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      },
    ]);

    const expired = await repository.findExpired(
      new Date("2020-06-01T00:00:00.000Z"),
      10,
    );

    expect(expired.map((item) => item.id)).toEqual(["old-1", "old-2"]);
    await expect(
      repository.findExpired(new Date("2020-06-01T00:00:00.000Z"), 1),
    ).resolves.toHaveLength(1);
    await expect(repository.deleteMany(["old-1", "old-2", "x"])).resolves.toBe(
      2,
    );
    await expect(repository.deleteMany([])).resolves.toBe(0);
  });
});
