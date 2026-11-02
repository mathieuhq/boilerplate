import { vi } from "vitest";

import type { PrismaClient } from "@/lib/generated/prisma/client";

export function createQueryRawPrisma(rows: unknown[]) {
  const queryRaw = vi.fn().mockResolvedValue(rows);

  return {
    queryRaw,
    prisma: { $queryRaw: queryRaw } as unknown as PrismaClient,
  };
}

export function getQuery(queryRaw: ReturnType<typeof vi.fn>) {
  const [strings, ...values] = queryRaw.mock.calls[0] as [
    TemplateStringsArray,
    ...unknown[],
  ];

  return { sql: strings.join("?"), values };
}
