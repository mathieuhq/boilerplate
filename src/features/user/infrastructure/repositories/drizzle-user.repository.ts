import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as schema from "@/db/schema";
import { users } from "@/db/schema";

import type { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import type { Email } from "../../domain/value-objects/email.value-object";
import type { UserId } from "../../domain/value-objects/user-id.value-object";
import { toDomain, toPersistence } from "../mappers/drizzle-user.mapper";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async findById(id: UserId): Promise<User | null> {
    const userData = await this.db.query.users.findFirst({
      where: eq(users.id, id.value),
    });

    if (!userData) return null;

    return toDomain(userData);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await this.db.query.users.findFirst({
      where: eq(users.email, email.value),
    });

    if (!userData) return null;

    return toDomain(userData);
  }

  async findByStripeCustomerId(customerId: string): Promise<User | null> {
    const userData = await this.db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    });

    if (!userData) return null;

    return toDomain(userData);
  }

  async save(user: User): Promise<User> {
    const data = toPersistence(user);

    const [savedData] = await this.db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.id,
        set: data,
      })
      .returning();

    return toDomain(savedData);
  }

  async delete(id: UserId): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id.value));
  }

  async isEmailTaken(email: Email, excludeUserId?: UserId): Promise<boolean> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email.value),
      columns: { id: true },
    });

    if (!user) return false;
    if (excludeUserId && user.id === excludeUserId.value) return false;

    return true;
  }
}
