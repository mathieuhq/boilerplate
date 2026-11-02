import { describe, expect, it, vi } from "vitest";

import type { IExpiredAuthRecordsPort } from "../ports/expired-auth-records.port";
import { PurgeExpiredAuthRecordsUseCase } from "../use-cases/purge-expired-auth-records.use-case";

describe("PurgeExpiredAuthRecordsUseCase", () => {
  it("purges records that expired before now and returns the counts", async () => {
    const now = new Date("2026-11-02T03:00:00.000Z");
    const purged = {
      sessions: 4,
      verifications: 2,
      oauthAccessTokens: 1,
      oauthRefreshTokens: 0,
      oauthClientAssertions: 3,
    };
    const expiredAuthRecords: IExpiredAuthRecordsPort = {
      purgeExpiredBefore: vi.fn().mockResolvedValue(purged),
    };
    const useCase = new PurgeExpiredAuthRecordsUseCase(
      expiredAuthRecords,
      () => now,
    );

    const result = await useCase.execute({});

    expect(result.value).toEqual(purged);
    expect(expiredAuthRecords.purgeExpiredBefore).toHaveBeenCalledWith(now);
  });

  it("uses the current time by default", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-02T04:00:00.000Z") });
    const expiredAuthRecords: IExpiredAuthRecordsPort = {
      purgeExpiredBefore: vi.fn().mockResolvedValue({
        sessions: 0,
        verifications: 0,
        oauthAccessTokens: 0,
        oauthRefreshTokens: 0,
        oauthClientAssertions: 0,
      }),
    };
    const useCase = new PurgeExpiredAuthRecordsUseCase(expiredAuthRecords);

    await useCase.execute({});

    expect(expiredAuthRecords.purgeExpiredBefore).toHaveBeenCalledWith(
      new Date("2026-11-02T04:00:00.000Z"),
    );
    vi.useRealTimers();
  });
});
