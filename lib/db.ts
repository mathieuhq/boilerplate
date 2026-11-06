import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "@/lib/schema";

const createDatabase = () =>
  drizzle({
    connection: { connectionString: process.env.DATABASE_URL },
    schema,
  });

export type Database = ReturnType<typeof createDatabase>;

export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { db: Database | undefined };

export const db = globalForDb.db ?? createDatabase();

globalForDb.db = db;
