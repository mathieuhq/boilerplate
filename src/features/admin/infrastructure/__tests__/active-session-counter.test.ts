import { beforeAll, describe, expect, it, vi } from "vitest";

import { session, user } from "@/lib/schema";
import { createTestDatabase } from "@/test/utils/test-database";

import {
  type ActiveSessionStore,
  DrizzleActiveSessionCounter,
  RedisActiveSessionCounter,
} from "../adapters/active-session-counter";

const NOW = 1_000_000;

const sessionList = (...sessions: { token: string; expiresAt: number }[]) =>
  JSON.stringify(sessions);

const createStore = (
  entries: Record<string, string>,
  pages: string[][] = [Object.keys(entries)],
) => {
  const scan = vi.fn<ActiveSessionStore["scan"]>(async (cursor) => {
    const index = Number(cursor);
    const next = index + 1 < pages.length ? String(index + 1) : "0";

    return [next, pages[index] ?? []];
  });
  const mget = vi.fn<ActiveSessionStore["mget"]>(async (keys) =>
    keys.map((key) => entries[key] ?? null),
  );

  return { store: { scan, mget } satisfies ActiveSessionStore, scan, mget };
};

describe("RedisActiveSessionCounter", () => {
  it("counts unexpired sessions across every user", async () => {
    const { store, scan } = createStore(
      {
        "active-sessions-a": sessionList(
          { token: "1", expiresAt: NOW + 10 },
          { token: "2", expiresAt: NOW - 10 },
        ),
        "active-sessions-b": sessionList(
          { token: "3", expiresAt: NOW + 10 },
          { token: "3", expiresAt: NOW + 20 },
          { token: "4", expiresAt: NOW + 30 },
        ),
      },
      [["active-sessions-a"], ["active-sessions-b", "active-sessions-a"]],
    );
    const counter = new RedisActiveSessionCounter(store, () => NOW);

    await expect(counter.countAll()).resolves.toBe(3);
    expect(scan).toHaveBeenCalledTimes(2);
    expect(scan).toHaveBeenCalledWith("0", "active-sessions-*");
  });

  it("returns zero without reading values when no list exists", async () => {
    const { store, mget } = createStore({});
    const counter = new RedisActiveSessionCounter(store, () => NOW);

    await expect(counter.countAll()).resolves.toBe(0);
    expect(mget).not.toHaveBeenCalled();
  });

  it("counts sessions for the requested users", async () => {
    const { store } = createStore({
      "active-sessions-a": sessionList({ token: "1", expiresAt: NOW + 10 }),
      "active-sessions-c": "not json",
    });
    const counter = new RedisActiveSessionCounter(store, () => NOW);

    await expect(counter.countByUser(["a", "b", "c"])).resolves.toEqual(
      new Map([
        ["a", 1],
        ["b", 0],
        ["c", 0],
      ]),
    );
  });

  it("skips the store for an empty user list", async () => {
    const { store, mget } = createStore({});
    const counter = new RedisActiveSessionCounter(store, () => NOW);

    await expect(counter.countByUser([])).resolves.toEqual(new Map());
    expect(mget).not.toHaveBeenCalled();
  });
});

describe("DrizzleActiveSessionCounter", () => {
  let counter: DrizzleActiveSessionCounter;

  beforeAll(async () => {
    const db = await createTestDatabase();
    const future = new Date(Date.now() + 60_000);
    const past = new Date(Date.now() - 60_000);

    await db.insert(user).values(
      ["a", "b", "c"].map((id) => ({
        id,
        name: id,
        email: `${id}@example.com`,
      })),
    );
    await db.insert(session).values([
      { token: "1", userId: "a", expiresAt: future },
      { token: "2", userId: "a", expiresAt: future },
      { token: "3", userId: "a", expiresAt: past },
      { token: "4", userId: "b", expiresAt: past },
      { token: "5", userId: "c", expiresAt: future },
    ]);
    counter = new DrizzleActiveSessionCounter(db);
  });

  it("counts unexpired sessions", async () => {
    await expect(counter.countAll()).resolves.toBe(3);
  });

  it("counts unexpired sessions for the requested users", async () => {
    await expect(counter.countByUser(["a", "b", "missing"])).resolves.toEqual(
      new Map([
        ["a", 2],
        ["b", 0],
        ["missing", 0],
      ]),
    );
  });

  it("skips the query for an empty user list", async () => {
    await expect(counter.countByUser([])).resolves.toEqual(new Map());
  });
});
