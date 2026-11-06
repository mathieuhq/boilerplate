import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const db = drizzle(process.env.DATABASE_URL ?? "");

try {
  await migrate(db, { migrationsFolder: import.meta.dirname });
} finally {
  await db.$client.end();
}
