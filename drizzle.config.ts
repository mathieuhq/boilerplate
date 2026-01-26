import type { Config } from "drizzle-kit";

import { env } from "@/lib/env";

export default {
  schema: "./src/db/schema/*.schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
} satisfies Config;
