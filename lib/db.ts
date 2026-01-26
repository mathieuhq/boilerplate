import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { env } from "@/lib/env";

declare global {
  var __db: ReturnType<typeof createDrizzleClient> | undefined;
}

function createDrizzleClient() {
  const connectionString = env.DATABASE_URL;
  // Disable prefetch as it's not supported for "Transaction" pool mode
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export const db = globalThis.__db ?? createDrizzleClient();

if (env.NODE_ENV !== "production") globalThis.__db = db;
