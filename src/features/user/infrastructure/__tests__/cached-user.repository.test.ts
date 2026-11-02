import { beforeEach, describe, expect, it, vi } from "vitest";

import { RedisCacheAdapter } from "@/shared/infrastructure/cache/redis-cache.adapter";
import { buildUser } from "@/test/utils/entity-builders";
import {
  createMemoryCacheStore,
  createMockUserRepository,
} from "@/test/utils/mock-factories";

import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import { Email } from "../../domain/value-objects/email.value-object";
import { UserId } from "../../domain/value-objects/user-id.value-object";
import { CachedUserRepository } from "../repositories/cached-user.repository";

describe("CachedUserRepository", () => {
  let inner: IUserRepository;
  let store: ReturnType<typeof createMemoryCacheStore>;
  let repository: CachedUserRepository;

  beforeEach(() => {
    inner = createMockUserRepository();
    store = createMemoryCacheStore();
    repository = new CachedUserRepository(
      inner,
      new RedisCacheAdapter(store, "test"),
    );
  });

  it("reads the user once and serves it from the cache afterwards", async () => {
    const user = buildUser({ birthDate: new Date("1990-05-06") });
    vi.mocked(inner.findById).mockResolvedValue(user);

    const first = await repository.findById(UserId.create("user-123"));
    const second = await repository.findById(UserId.create("user-123"));

    expect(inner.findById).toHaveBeenCalledOnce();
    expect(second?.id.value).toBe("user-123");
    expect(second?.email.value).toBe(first?.email.value);
    expect(second?.birthDate).toEqual(new Date("1990-05-06"));
    expect(second?.createdAt).toBeInstanceOf(Date);
    expect(second?.notificationPreferences).toEqual(
      user.notificationPreferences,
    );
  });

  it("does not cache a missing user", async () => {
    vi.mocked(inner.findById).mockResolvedValue(null);

    await expect(
      repository.findById(UserId.create("user-123")),
    ).resolves.toBeNull();
    await repository.findById(UserId.create("user-123"));

    expect(inner.findById).toHaveBeenCalledTimes(2);
  });

  it("invalidates the cached user on save", async () => {
    const user = buildUser();
    vi.mocked(inner.findById).mockResolvedValue(user);
    vi.mocked(inner.save).mockResolvedValue(user);

    await repository.findById(UserId.create("user-123"));
    await expect(repository.save(user)).resolves.toBe(user);
    await repository.findById(UserId.create("user-123"));

    expect(inner.findById).toHaveBeenCalledTimes(2);
  });

  it("invalidates the user and its organizations on delete", async () => {
    await repository.delete(UserId.create("user-123"));

    expect(inner.delete).toHaveBeenCalledOnce();
    expect(store.del).toHaveBeenCalledWith(
      "test:user:user-123",
      "test:user:user-123:organizations",
    );
  });

  it("delegates email lookups without caching", async () => {
    const user = buildUser();
    const email = Email.create("test@example.com");
    vi.mocked(inner.findByEmail).mockResolvedValue(user);
    vi.mocked(inner.isEmailTaken).mockResolvedValue(true);

    await expect(repository.findByEmail(email)).resolves.toBe(user);
    await expect(repository.isEmailTaken(email)).resolves.toBe(true);
    expect(store.set).not.toHaveBeenCalled();
  });
});
