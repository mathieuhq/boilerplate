import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Language } from "@/lib/generated/prisma/enums";

type ListUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
};

type UpdateUserParams = {
  name?: string;
  email?: string;
  image?: string;
  birthDate?: Date;
  language?: Language;
  resendContactId?: string;
};

/**
 * Service layer for user data operations
 */
class UserService {
  /**
   * Gets a user by ID
   */
  async getUserById(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        language: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        resendContactId: true,
      },
    });

    return user;
  }

  /**
   * Gets a user by email
   */
  async getUserByEmail(email: string) {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
      },
    });

    return user;
  }

  /**
   * Lists users with pagination and search
   */
  async listUsers(params: ListUsersParams = {}) {
    const { page = 1, limit = 10, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          emailVerified: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Updates a user's profile
   */
  async updateUser(userId: string, data: UpdateUserParams) {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.image && { image: data.image }),
        ...(data.language !== undefined && { language: data.language }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(data.resendContactId !== undefined && {
          resendContactId: data.resendContactId,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        language: true,
        createdAt: true,
        updatedAt: true,
        birthDate: true,
        emailVerified: true,
        resendContactId: true,
      },
    });

    return user;
  }

  /**
   * Deletes a user account
   */
  async deleteUser(userId: string) {
    await db.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }

  /**
   * Checks if email is already taken
   */
  async isEmailTaken(email: string, excludeUserId?: string) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) return false;

    if (excludeUserId && user.id === excludeUserId) return false;

    return true;
  }
}

export const userService = new UserService();
