import { eq } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { user as userTable } from "@/lib/schema";

import type { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import type { Email } from "../../domain/value-objects/email.value-object";
import type { UserId } from "../../domain/value-objects/user-id.value-object";
import { toDomain, toPersistence } from "../mappers/drizzle-user.mapper";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: Database) {}

  async findById(id: UserId): Promise<User | null> {
    const userData = await this.db.query.user.findFirst({
      where: eq(userTable.id, id.value),
    });

    if (!userData) return null;

    return toDomain(userData);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await this.db.query.user.findFirst({
      where: eq(userTable.email, email.value),
    });

    if (!userData) return null;

    return toDomain(userData);
  }

  async save(user: User): Promise<User> {
    const data = toPersistence(user);
    const {
      id: _id,
      email: _email,
      emailVerified: _emailVerified,
      createdAt: _createdAt,
      ...profileData
    } = data;

    const [savedData] = await this.db
      .insert(userTable)
      .values(data)
      .onConflictDoUpdate({ target: userTable.id, set: profileData })
      .returning();

    return toDomain(savedData);
  }

  async delete(id: UserId): Promise<void> {
    const deleted = await this.db
      .delete(userTable)
      .where(eq(userTable.id, id.value))
      .returning({ id: userTable.id });

    if (deleted.length === 0) throw new Error(`User ${id.value} not found`);
  }

  async isEmailTaken(email: Email, excludeUserId?: UserId): Promise<boolean> {
    const user = await this.db.query.user.findFirst({
      where: eq(userTable.email, email.value),
      columns: { id: true },
    });

    if (!user) return false;
    if (user.id === excludeUserId?.value) return false;

    return true;
  }
}
