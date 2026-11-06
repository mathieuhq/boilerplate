import { definePlugin } from "nitro";

import type { Database } from "@/lib/db";
import type { redis } from "@/lib/redis";

const connections = globalThis as unknown as {
  db: Database | undefined;
  redis: typeof redis | undefined;
};

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("close", async () => {
    connections.redis?.disconnect();
    await connections.db?.$client.end();
  });
});
