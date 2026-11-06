import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";

import type { Database } from "@/lib/db";
import * as schema from "@/lib/schema";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { unaccent } from "@electric-sql/pglite/contrib/unaccent";

export async function createTestDatabase() {
  const client = new PGlite({ extensions: { pg_trgm, unaccent } });

  const db = drizzle({ client, schema });

  await migrate(db, { migrationsFolder: "drizzle" });

  return db as unknown as Database;
}
