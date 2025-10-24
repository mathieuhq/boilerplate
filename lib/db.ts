import { PrismaClient } from "@/generated/prisma/client";

/**
 * Creates a singleton Prisma client instance
 */
const prismaClientSingleton = () => new PrismaClient();

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

/**
 * Global Prisma database client instance
 * Reuses the same instance in development to prevent connection exhaustion
 */
export const db = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
