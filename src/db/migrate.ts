/* eslint-disable no-console -- CLI script needs console output */
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "@/lib/env";

export async function runMigrations() {
  const connectionString = env.DATABASE_URL;

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  console.log("Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await migrationClient.end();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Database migration completed");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database migration failed:", err);
      process.exit(1);
    });
}
