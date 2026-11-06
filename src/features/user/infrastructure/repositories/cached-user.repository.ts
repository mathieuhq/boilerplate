import { CacheKeys, CacheTtl } from "@/shared/application/cache-keys";
import type { ICachePort } from "@/shared/application/ports/cache.port";

import type { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import type { Email } from "../../domain/value-objects/email.value-object";
import type { UserId } from "../../domain/value-objects/user-id.value-object";
import { toDomain, toPersistence } from "../mappers/drizzle-user.mapper";

export class CachedUserRepository implements IUserRepository {
  constructor(
    private readonly repository: IUserRepository,
    private readonly cache: ICachePort,
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const record = await this.cache.getOrSet(
      CacheKeys.user(id.value),
      CacheTtl.user,
      async () => {
        const user = await this.repository.findById(id);

        return user ? toPersistence(user) : null;
      },
    );

    return record ? toDomain(record) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  async save(user: User): Promise<User> {
    const savedUser = await this.repository.save(user);

    await this.cache.delete(CacheKeys.user(user.id.value));

    return savedUser;
  }

  async delete(id: UserId): Promise<void> {
    await this.repository.delete(id);
    await this.cache.delete(
      CacheKeys.user(id.value),
      CacheKeys.userOrganizations(id.value),
    );
  }

  async isEmailTaken(email: Email, excludeUserId?: UserId): Promise<boolean> {
    return this.repository.isEmailTaken(email, excludeUserId);
  }
}
