import { definePlugin } from "nitro";

import type { db } from "@/lib/db";
import type { redis } from "@/lib/redis";

const connections = globalThis as unknown as {
  prisma: typeof db | undefined;
  redis: typeof redis | undefined;
};

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("close", async () => {
    connections.redis?.disconnect();
    await connections.prisma?.$disconnect();
  });
});
