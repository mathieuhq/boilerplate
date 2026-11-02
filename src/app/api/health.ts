import { createFileRoute } from "@tanstack/react-router";

import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";
import { HttpStatus } from "@/shared/infrastructure/http/http-status";

const CHECK_TIMEOUT_MS = 3_000;

async function check(probe: () => Promise<unknown>) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      probe(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("timeout")),
          CHECK_TIMEOUT_MS,
        );
      }),
    ]);

    return "ok" as const;
  } catch {
    return "error" as const;
  } finally {
    clearTimeout(timer);
  }
}

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const [database, cache] = await Promise.all([
          check(async () => db.$queryRaw`SELECT 1`),
          redis
            ? check(async () => redis?.ping())
            : Promise.resolve("ok" as const),
        ]);

        const checks = { database, redis: cache };

        const response =
          database === "ok" && cache === "ok"
            ? ApiResponse.success({
                status: "ok",
                checks,
                timestamp: new Date().toISOString(),
              })
            : ApiResponse.error(
                "SERVICE_UNAVAILABLE",
                "A dependency is unavailable",
                HttpStatus.SERVICE_UNAVAILABLE,
                checks,
              );

        response.headers.set("Cache-Control", "no-store");

        return response;
      },
    },
  },
});
