import path from "node:path";
import type { PrismaConfig } from "prisma";

import "dotenv/config";

/**
 * Prisma ORM configuration
 */
export default {
  schema: path.join("prisma"),
} satisfies PrismaConfig;
