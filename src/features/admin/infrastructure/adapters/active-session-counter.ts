import type { PrismaClient } from "@/lib/generated/prisma/client";

export type ActiveSessionCounter = {
  countAll: () => Promise<number>;
  countByUser: (userIds: string[]) => Promise<Map<string, number>>;
};

export type ActiveSessionStore = {
  scan: (cursor: string, pattern: string) => Promise<[string, string[]]>;
  mget: (keys: string[]) => Promise<(string | null)[]>;
};

type SessionReference = {
  token?: unknown;
  expiresAt?: unknown;
};

const ACTIVE_SESSIONS_PREFIX = "active-sessions-";

export class RedisActiveSessionCounter implements ActiveSessionCounter {
  constructor(
    private readonly store: ActiveSessionStore,
    private readonly now: () => number = Date.now,
  ) {}

  async countAll(): Promise<number> {
    const keys = await this.scanKeys("0", new Set());

    if (keys.length === 0) return 0;

    const lists = await this.store.mget(keys);

    return lists.reduce((total, list) => total + this.countList(list), 0);
  }

  async countByUser(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const lists = await this.store.mget(
      userIds.map((userId) => `${ACTIVE_SESSIONS_PREFIX}${userId}`),
    );

    return new Map(
      userIds.map((userId, index) => [userId, this.countList(lists[index])]),
    );
  }

  private async scanKeys(cursor: string, keys: Set<string>): Promise<string[]> {
    const [nextCursor, batch] = await this.store.scan(
      cursor,
      `${ACTIVE_SESSIONS_PREFIX}*`,
    );

    batch.forEach((key) => keys.add(key));

    if (nextCursor === "0") return [...keys];

    return this.scanKeys(nextCursor, keys);
  }

  private countList(list: string | null | undefined): number {
    if (!list) return 0;

    const references = parseReferences(list);
    const now = this.now();
    const activeTokens = new Set(
      references
        .filter(
          (reference) =>
            typeof reference.expiresAt === "number" &&
            reference.expiresAt > now,
        )
        .map((reference) => reference.token),
    );

    return activeTokens.size;
  }
}

export class PrismaActiveSessionCounter implements ActiveSessionCounter {
  constructor(private readonly prisma: PrismaClient) {}

  async countAll(): Promise<number> {
    return this.prisma.session.count({
      where: { expiresAt: { gt: new Date() } },
    });
  }

  async countByUser(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();

    const groups = await this.prisma.session.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, expiresAt: { gt: new Date() } },
      _count: { _all: true },
    });

    const counts = new Map(
      groups.map((group) => [group.userId, group._count._all]),
    );

    return new Map(userIds.map((userId) => [userId, counts.get(userId) ?? 0]));
  }
}

function parseReferences(list: string): SessionReference[] {
  try {
    const parsed: unknown = JSON.parse(list);

    return Array.isArray(parsed) ? (parsed as SessionReference[]) : [];
  } catch {
    return [];
  }
}
