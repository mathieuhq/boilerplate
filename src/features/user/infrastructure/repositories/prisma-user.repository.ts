import type { PrismaClient } from "@/lib/generated/prisma/client";

import type { User } from "../../domain/entities/user.entity";
import type { IUserRepository } from "../../domain/repositories/user.repository.interface";
import type { Email } from "../../domain/value-objects/email.value-object";
import type { UserId } from "../../domain/value-objects/user-id.value-object";
import { toDomain, toPersistence } from "../mappers/prisma-user.mapper";

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id: id.value },
    });

    if (!userData) return null;

    return toDomain(userData);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email: email.value },
    });

    if (!userData) return null;

    return toDomain(userData);
  }

  async save(user: User): Promise<User> {
    const data = toPersistence(user);

    const savedData = await this.prisma.user.upsert({
      where: { id: user.id.value },
      create: data,
      update: data,
    });

    return toDomain(savedData);
  }

  async delete(id: UserId): Promise<void> {
    await this.prisma.user.delete({
      where: { id: id.value },
    });
  }

  async isEmailTaken(email: Email, excludeUserId?: UserId): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.value },
      select: { id: true },
    });

    if (!user) return false;
    if (user.id === excludeUserId?.value) return false;

    return true;
  }
}
