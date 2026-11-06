import { beforeAll, describe, expect, it } from "vitest";

import type { Database } from "@/lib/db";
import { buildUser } from "@/test/utils/entity-builders";
import { createTestDatabase } from "@/test/utils/test-database";

import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import { DrizzleUserRepository } from "../repositories/drizzle-user.repository";

describe("DrizzleUserRepository", () => {
  let db: Database;
  let repository: DrizzleUserRepository;

  beforeAll(async () => {
    db = await createTestDatabase();
    repository = new DrizzleUserRepository(db);
  });

  it("creates a user then finds it by id and email", async () => {
    const user = buildUser({
      id: UserId.create("user-find"),
      email: Email.create("user-find@example.com"),
      birthDate: new Date("1990-05-06"),
    });

    await repository.save(user);

    const byId = await repository.findById(user.id);
    const byEmail = await repository.findByEmail(user.email);

    expect(byId?.email.value).toBe(user.email.value);
    expect(byId?.birthDate).toEqual(new Date("1990-05-06"));
    expect(byEmail?.id.value).toBe(user.id.value);
  });

  it("returns null for unknown users", async () => {
    await expect(
      repository.findById(UserId.create("missing")),
    ).resolves.toBeNull();
    await expect(
      repository.findByEmail(Email.create("missing@example.com")),
    ).resolves.toBeNull();
  });

  it("updates the profile but keeps the email and verification on save", async () => {
    const user = buildUser({
      id: UserId.create("user-update"),
      email: Email.create("user-update@example.com"),
    });

    await repository.save(user);

    const changed = buildUser({
      id: user.id,
      name: "Renamed",
      email: Email.create("changed@example.com"),
      emailVerified: false,
    });
    const saved = await repository.save(changed);

    expect(saved.name).toBe("Renamed");
    expect(saved.email.value).toBe(user.email.value);
    expect(saved.isEmailVerified).toBe(user.isEmailVerified);
  });

  it("checks whether an email is taken by another user", async () => {
    const user = buildUser({
      id: UserId.create("user-taken"),
      email: Email.create("user-taken@example.com"),
    });

    await repository.save(user);

    await expect(repository.isEmailTaken(user.email)).resolves.toBe(true);
    await expect(repository.isEmailTaken(user.email, user.id)).resolves.toBe(
      false,
    );
    await expect(
      repository.isEmailTaken(Email.create("free@example.com")),
    ).resolves.toBe(false);
  });

  it("deletes a user and throws when it does not exist", async () => {
    const user = buildUser({
      id: UserId.create("user-delete"),
      email: Email.create("user-delete@example.com"),
    });

    await repository.save(user);
    await repository.delete(user.id);

    await expect(repository.findById(user.id)).resolves.toBeNull();
    await expect(repository.delete(user.id)).rejects.toThrow();
  });
});
